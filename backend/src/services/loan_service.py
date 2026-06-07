import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import TokenData
from src.core.exceptions import AppError, ForbiddenError, NotFoundError
from src.db.crud.loan import (
    create_loan,
    get_loan,
    list_distinct_industries,
    list_loans,
    update_loan,
)
from src.db.models.loan import Loan
from src.services.company_service import get_my_company
from src.services.loan_scoring import loan_application_from_create_payload, score_loan_application
from src.services.scoring import ScoreResult, compute_score


def _score_for_loan(loan: Loan, documents: int = 0) -> ScoreResult:
    return compute_score(
        company_name=loan.company.name if loan.company else "",
        title=loan.title,
        amount=loan.amount,
        term_days=loan.term_days,
        interest_rate=loan.interest_rate,
        industry=loan.industry,
        documents=documents,
    )


async def create_loan_request(db: AsyncSession, user_id: str, data: dict) -> Loan:
    """Publish a new trade deal as 'pending_approval'.

    Requires the caller to already have a company profile (the new-deal flow in
    the UI upserts the company first).
    """
    company = await get_my_company(db, user_id)
    if not company:
        raise AppError(400, "Create a company profile before submitting a deal")

    deadline = data.get("auction_deadline") or datetime.now(UTC) + timedelta(days=14)
    application_input = loan_application_from_create_payload(
        data,
        company_name=company.name,
        company_industry=company.industry,
    )
    scoring_input, credit_score = await score_loan_application(application_input)
    credit_score_payload = credit_score.model_dump(mode="json")

    loan = await create_loan(
        db,
        company_id=company.id,
        owner_user_id=user_id,
        title=data["title"],
        description=data.get("description"),
        purpose=data.get("purpose"),
        trade_type=data.get("trade_type", "import"),
        industry=data.get("industry") or company.industry,
        goods=data.get("goods"),
        origin_country=data.get("origin_country"),
        destination_country=data.get("destination_country"),
        amount=data["amount"],
        currency=data.get("currency", "HKD"),
        term_days=data.get("term_days", 90),
        interest_rate=data.get("interest_rate", 8.0),
        auction_deadline=deadline,
        status="pending_approval",
        risk_score=round(credit_score.total_score),
        risk_grade=credit_score.grade,
        credit_score=credit_score_payload,
        loan_scoring_input=scoring_input.model_dump(mode="json"),
    )
    return loan


async def list_marketplace(db: AsyncSession, **filters) -> Sequence[Loan]:
    return await list_loans(db, **filters)


async def list_my_loans(db: AsyncSession, user_id: str) -> Sequence[Loan]:
    return await list_loans(db, owner_user_id=user_id, status=None, sort="newest", limit=200)


async def get_loan_or_404(db: AsyncSession, loan_id: uuid.UUID) -> Loan:
    loan = await get_loan(db, loan_id)
    if not loan:
        raise NotFoundError("Loan")
    return loan


def score_breakdown(loan: Loan, documents: int) -> ScoreResult:
    """Recompute the explainable factor breakdown for the detail page."""
    return _score_for_loan(loan, documents=documents)


async def approve_loan(db: AsyncSession, loan_id: uuid.UUID, user: TokenData) -> Loan:
    """Move a deal live. Admins can approve any deal; for demo convenience the
    deal owner may also publish their own pending deal."""
    loan = await get_loan_or_404(db, loan_id)
    if not (user.has_role("admin") or loan.owner_user_id == user.user_id):
        raise ForbiddenError()
    deadline = loan.auction_deadline or datetime.now(UTC) + timedelta(days=14)
    score_changes = {}
    if loan.credit_score:
        score_changes = {
            "risk_score": round(float(loan.credit_score["total_score"])),
            "risk_grade": loan.credit_score.get("grade"),
        }
    else:
        documents = len(loan.documents)
        result = _score_for_loan(loan, documents=documents)
        score_changes = {"risk_score": result.score, "risk_grade": result.grade}

    return await update_loan(
        db,
        loan,
        status="open",
        auction_deadline=deadline,
        **score_changes,
    )


async def reject_loan(db: AsyncSession, loan_id: uuid.UUID, user: TokenData) -> Loan:
    loan = await get_loan_or_404(db, loan_id)
    if not user.has_role("admin"):
        raise ForbiddenError()
    return await update_loan(db, loan, status="rejected")


async def marketplace_industries(db: AsyncSession) -> list[str]:
    return await list_distinct_industries(db)
