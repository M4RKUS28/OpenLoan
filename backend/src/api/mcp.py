"""Model Context Protocol (MCP) server exposed over Streamable HTTP.

Implements the JSON-RPC request/response subset of the MCP "Streamable HTTP"
transport in *stateless* mode: clients POST JSON-RPC messages to ``/mcp`` and
receive a single ``application/json`` response. That is enough to expose
read-only tools — here, browsing the OpenLoan trade-finance marketplace — to
MCP-compatible clients (Claude, the MCP Inspector, etc.) without depending on
the full MCP SDK or server-initiated SSE streams.

Reference: MCP transport spec, methods ``initialize``, ``tools/list``,
``tools/call`` plus the ``notifications/initialized`` handshake.
"""

import json
import logging
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from fastapi import Depends

from src.db.crud.loan import get_loan
from src.db.database import get_db
from src.db.models.loan import Loan
from src.services.loan_service import list_marketplace

logger = logging.getLogger(__name__)

# Latest MCP protocol revision we speak. We echo the client's requested version
# when present (forward/backward compatible), falling back to this otherwise.
PROTOCOL_VERSION = "2025-06-18"
SERVER_INFO = {"name": "openloan-mcp", "title": "OpenLoan Marketplace", "version": "1.0.0"}

DbDep = Annotated[AsyncSession, Depends(get_db)]


class ToolError(Exception):
    """Raised by a tool handler to return an MCP tool error (isError: true)
    rather than a JSON-RPC protocol error."""


# ── tools ─────────────────────────────────────────────────────────────────────


def _auction_to_dict(loan: Loan) -> dict:
    """Compact, LLM-friendly view of a single auction (loan)."""
    active = [b for b in loan.bids if b.status in ("pending", "accepted")]
    best = min((b.interest_rate for b in active), default=None)
    return {
        "id": str(loan.id),
        "title": loan.title,
        "company": loan.company.name if loan.company else None,
        "industry": loan.industry,
        "trade_type": loan.trade_type,
        "goods": loan.goods,
        "purpose": loan.purpose,
        "origin_country": loan.origin_country,
        "destination_country": loan.destination_country,
        "amount": float(loan.amount),
        "currency": loan.currency,
        "funded_amount": float(loan.funded_amount),
        "term_days": loan.term_days,
        "interest_rate": loan.interest_rate,
        "status": loan.status,
        "risk_score": loan.risk_score,
        "risk_grade": loan.risk_grade,
        "auction_deadline": loan.auction_deadline.isoformat() if loan.auction_deadline else None,
        "bid_count": len(active),
        "best_bid_rate": best,
        "created_at": loan.created_at.isoformat() if loan.created_at else None,
    }


async def _tool_list_auctions(db: AsyncSession, args: dict) -> dict:
    limit = args.get("limit", 20)
    try:
        limit = max(1, min(int(limit), 100))
    except (TypeError, ValueError):
        limit = 20
    loans = await list_marketplace(
        db,
        search=args.get("search"),
        status=args.get("status") or "open",
        industry=args.get("industry"),
        trade_type=args.get("trade_type"),
        risk_grade=args.get("risk_grade"),
        sort=args.get("sort", "newest"),
        limit=limit,
    )
    return {"count": len(loans), "auctions": [_auction_to_dict(loan) for loan in loans]}


async def _tool_get_auction(db: AsyncSession, args: dict) -> dict:
    raw = args.get("auction_id")
    try:
        loan_id = uuid.UUID(str(raw))
    except (TypeError, ValueError):
        raise ToolError(f"Invalid auction_id: {raw!r} (expected a UUID)")
    loan = await get_loan(db, loan_id)
    if loan is None:
        raise ToolError(f"No auction found with id {raw}")
    data = _auction_to_dict(loan)
    data["description"] = loan.description
    data["bids"] = [
        {
            "id": str(b.id),
            "lender_name": b.lender_name,
            "amount": float(b.amount),
            "interest_rate": b.interest_rate,
            "status": b.status,
            "message": b.message,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in loan.bids
    ]
    return data


# Tool metadata advertised via tools/list, paired with its async handler.
TOOLS = [
    {
        "name": "list_auctions",
        "title": "List loan auctions",
        "description": (
            "Browse the OpenLoan trade-finance marketplace. Returns live loan "
            "auctions (deals seeking financing) with amount, term, interest rate, "
            "risk grade and current bids. Supports free-text search, filtering and "
            "sorting. Use get_auction for full details on a specific deal."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "search": {
                    "type": "string",
                    "description": "Free-text search over title, goods, description and company name.",
                },
                "industry": {"type": "string", "description": "Filter by industry, e.g. 'Electronics'."},
                "trade_type": {
                    "type": "string",
                    "enum": ["import", "export"],
                    "description": "Filter by trade direction.",
                },
                "risk_grade": {"type": "string", "description": "Filter by OpenLoan risk grade (A–E)."},
                "status": {
                    "type": "string",
                    "enum": ["open", "funded", "repaid", "closed"],
                    "description": "Auction status. Defaults to 'open' (live auctions accepting bids).",
                },
                "sort": {
                    "type": "string",
                    "enum": ["newest", "deadline", "rate", "amount", "score"],
                    "description": "Sort order. Defaults to 'newest'.",
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "description": "Maximum number of auctions to return (default 20).",
                },
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "get_auction",
        "title": "Get auction details",
        "description": (
            "Fetch full details for a single loan auction by its id, including the "
            "long description and the list of current bids."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "auction_id": {
                    "type": "string",
                    "description": "The auction (loan) UUID, as returned by list_auctions.",
                }
            },
            "required": ["auction_id"],
            "additionalProperties": False,
        },
    },
]

_TOOL_HANDLERS = {
    "list_auctions": _tool_list_auctions,
    "get_auction": _tool_get_auction,
}


# ── JSON-RPC plumbing ───────────────────────────────────────────────────────


def _result(msg_id, result: dict) -> dict:
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


def _error(msg_id, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}


def _tool_ok(data: dict) -> dict:
    text = json.dumps(data, indent=2, ensure_ascii=False)
    return {
        "content": [{"type": "text", "text": text}],
        "structuredContent": data,
        "isError": False,
    }


def _tool_err(message: str) -> dict:
    return {"content": [{"type": "text", "text": message}], "isError": True}


async def _dispatch(message: dict, db: AsyncSession) -> dict | None:
    """Handle one JSON-RPC message. Returns a response dict, or None for
    notifications (which get no reply)."""
    if not isinstance(message, dict) or message.get("jsonrpc") != "2.0":
        return _error(None, -32600, "Invalid Request")

    method = message.get("method")
    msg_id = message.get("id")
    is_notification = "id" not in message

    if method == "initialize":
        params = message.get("params") or {}
        return _result(
            msg_id,
            {
                "protocolVersion": params.get("protocolVersion", PROTOCOL_VERSION),
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": SERVER_INFO,
                "instructions": (
                    "Use list_auctions to browse the OpenLoan trade-finance "
                    "marketplace, then get_auction for full details on a deal."
                ),
            },
        )

    if method == "ping":
        return _result(msg_id, {})

    if method == "tools/list":
        return _result(msg_id, {"tools": TOOLS})

    if method == "tools/call":
        params = message.get("params") or {}
        name = params.get("name")
        args = params.get("arguments") or {}
        handler = _TOOL_HANDLERS.get(name)
        if handler is None:
            return _error(msg_id, -32602, f"Unknown tool: {name}")
        try:
            data = await handler(db, args)
        except ToolError as exc:
            return _result(msg_id, _tool_err(str(exc)))
        except Exception:  # surface unexpected failures as a tool error, not a 500
            logger.exception("MCP tool %s failed", name)
            return _result(msg_id, _tool_err(f"Tool {name} failed unexpectedly."))
        return _result(msg_id, _tool_ok(data))

    # Notifications (e.g. notifications/initialized) and unknown methods.
    if is_notification:
        return None
    return _error(msg_id, -32601, f"Method not found: {method}")


router = APIRouter(tags=["mcp"])


@router.post("/mcp")
async def mcp_post(request: Request, db: DbDep):
    """MCP Streamable HTTP endpoint — accepts a single JSON-RPC message or a
    batch and replies with application/json."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(_error(None, -32700, "Parse error"), status_code=400)

    if isinstance(body, list):  # JSON-RPC batch
        responses = [r for msg in body if (r := await _dispatch(msg, db)) is not None]
        if not responses:
            return Response(status_code=202)
        return JSONResponse(responses)

    response = await _dispatch(body, db)
    if response is None:  # notification — acknowledge with no body
        return Response(status_code=202)
    return JSONResponse(response)


@router.get("/mcp")
async def mcp_get():
    """No server-initiated SSE stream in stateless mode — signal Method Not
    Allowed as the spec prescribes."""
    return Response(status_code=405, headers={"Allow": "POST"})
