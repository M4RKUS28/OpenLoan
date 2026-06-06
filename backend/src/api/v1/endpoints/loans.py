import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.schemas.bid import BidCreateRequest, BidListResponse, BidResponse
from src.api.v1.schemas.company import CompanySummary
from src.api.v1.schemas.loan import (
    DocumentResponse,
    IndustryListResponse,
    LoanCreateRequest,
    LoanDetail,
    LoanListResponse,
    LoanSummary,
    ScoreFactorResponse,
    ScoreResponse,
)
from src.core.auth import TokenData, get_current_user, get_optional_user
from src.db.database import get_db
from src.db.models.loan import Loan
from src.services.bid_service import accept_bid, list_loan_bids, place_bid
from src.services.file_service import list_loan_documents
from src.services.loan_service import (
    approve_loan,
    create_loan_request,
    get_loan_or_404,
    list_marketplace,
    list_my_loans,
    marketplace_industries,
    reject_loan,
    score_breakdown,
)

router = APIRouter(prefix="/loans", tags=["loans"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[TokenData, Depends(get_current_user)]
OptionalUserDep = Annotated[TokenData | None, Depends(get_optional_user)]


# ── response builders ───────────────────────────────────────────────────────


def _build_summary(loan: Loan) -> LoanSummary:
    active = [b for b in loan.bids if b.status in ("pending", "accepted")]
    best = min((b.interest_rate for b in active), default=None)
    return LoanSummary(
        id=loan.id,
        title=loan.title,
        goods=loan.goods,
        purpose=loan.purpose,
        trade_type=loan.trade_type,
        industry=loan.industry,
        amount=float(loan.amount),
        currency=loan.currency,
        term_days=loan.term_days,
        interest_rate=loan.interest_rate,
        funded_amount=float(loan.funded_amount),
        status=loan.status,
        risk_score=loan.risk_score,
        risk_grade=loan.risk_grade,
        auction_deadline=loan.auction_deadline,
        created_at=loan.created_at,
        company=CompanySummary.model_validate(loan.company),
        bid_count=len(active),
        best_rate=best,
    )


def _build_detail(loan: Loan, documents: list[tuple]) -> LoanDetail:
    summary = _build_summary(loan)
    result = score_breakdown(loan, len(loan.documents))
    score = ScoreResponse(
        score=result.score,
        grade=result.grade,
        factors=[
            ScoreFactorResponse(
                key=f.key,
                label=f.label,
                description=f.description,
                score=f.score,
                weight=f.weight,
            )
            for f in result.factors
        ],
    )
    docs = [
        DocumentResponse(
            id=f.id,
            filename=f.filename,
            content_type=f.content_type,
            size_bytes=f.size_bytes,
            category=f.category,
            created_at=f.created_at,
            download_url=url,
        )
        for f, url in documents
    ]
    return LoanDetail(
        **summary.model_dump(),
        description=loan.description,
        origin_country=loan.origin_country,
        destination_country=loan.destination_country,
        owner_user_id=loan.owner_user_id,
        updated_at=loan.updated_at,
        score=score,
        documents=docs,
        bids=[BidResponse.model_validate(b) for b in loan.bids],
    )


# ── collection routes (declared before /{loan_id}) ──────────────────────────


@router.get("", response_model=LoanListResponse)
async def list_deals(
    db: DbDep,
    _user: OptionalUserDep,
    search: str | None = None,
    status: str | None = None,
    industry: str | None = None,
    trade_type: str | None = None,
    risk_grade: str | None = None,
    sort: str = "newest",
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    loans = await list_marketplace(
        db,
        search=search,
        status=status,
        industry=industry,
        trade_type=trade_type,
        risk_grade=risk_grade,
        sort=sort,
        offset=offset,
        limit=limit,
    )
    return LoanListResponse(items=[_build_summary(loan) for loan in loans])


@router.get("/industries", response_model=IndustryListResponse)
async def industries(db: DbDep):
    return IndustryListResponse(items=await marketplace_industries(db))


@router.get("/mine", response_model=LoanListResponse)
async def my_deals(db: DbDep, user: UserDep):
    loans = await list_my_loans(db, user.user_id)
    return LoanListResponse(items=[_build_summary(loan) for loan in loans])


@router.post("", response_model=LoanDetail, status_code=201)
async def create_deal(body: LoanCreateRequest, db: DbDep, user: UserDep):
    loan = await create_loan_request(db, user.user_id, body.model_dump())
    return _build_detail(loan, [])


# ── item routes ─────────────────────────────────────────────────────────────


@router.get("/{loan_id}", response_model=LoanDetail)
async def get_deal(loan_id: uuid.UUID, db: DbDep, _user: OptionalUserDep):
    loan = await get_loan_or_404(db, loan_id)
    documents = await list_loan_documents(db, loan_id)
    return _build_detail(loan, documents)


@router.post("/{loan_id}/approve", response_model=LoanSummary)
async def approve_deal(loan_id: uuid.UUID, db: DbDep, user: UserDep):
    loan = await approve_loan(db, loan_id, user)
    return _build_summary(loan)


@router.post("/{loan_id}/reject", response_model=LoanSummary)
async def reject_deal(loan_id: uuid.UUID, db: DbDep, user: UserDep):
    loan = await reject_loan(db, loan_id, user)
    return _build_summary(loan)


@router.get("/{loan_id}/bids", response_model=BidListResponse)
async def get_deal_bids(loan_id: uuid.UUID, db: DbDep, _user: OptionalUserDep):
    bids = await list_loan_bids(db, loan_id)
    return BidListResponse(items=[BidResponse.model_validate(b) for b in bids])


@router.post("/{loan_id}/bids", response_model=BidResponse, status_code=201)
async def create_deal_bid(
    loan_id: uuid.UUID, body: BidCreateRequest, db: DbDep, user: UserDep
):
    bid = await place_bid(db, loan_id, user, body.model_dump())
    return BidResponse.model_validate(bid)


@router.post("/{loan_id}/bids/{bid_id}/accept", response_model=LoanDetail)
async def accept_deal_bid(
    loan_id: uuid.UUID, bid_id: uuid.UUID, db: DbDep, user: UserDep
):
    loan, _bid = await accept_bid(db, loan_id, bid_id, user)
    documents = await list_loan_documents(db, loan_id)
    return _build_detail(loan, documents)
