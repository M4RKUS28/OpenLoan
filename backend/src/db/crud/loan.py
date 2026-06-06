import uuid
from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.company import Company
from src.db.models.loan import Loan

# Sort keys exposed to the marketplace UI -> ORDER BY expression.
_SORTS = {
    "newest": Loan.created_at.desc(),
    "deadline": Loan.auction_deadline.asc().nulls_last(),
    "rate": Loan.interest_rate.desc(),
    "amount": Loan.amount.desc(),
    "score": Loan.risk_score.desc().nulls_last(),
}


async def create_loan(db: AsyncSession, **kwargs) -> Loan:
    loan = Loan(**kwargs)
    db.add(loan)
    await db.flush()
    await db.refresh(loan)
    return loan


async def get_loan(db: AsyncSession, loan_id: uuid.UUID) -> Loan | None:
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    return result.scalar_one_or_none()


async def list_loans(
    db: AsyncSession,
    *,
    search: str | None = None,
    status: str | None = None,
    industry: str | None = None,
    trade_type: str | None = None,
    risk_grade: str | None = None,
    owner_user_id: str | None = None,
    sort: str = "newest",
    offset: int = 0,
    limit: int = 50,
) -> Sequence[Loan]:
    stmt = select(Loan).join(Company, Loan.company_id == Company.id)

    if status:
        stmt = stmt.where(Loan.status == status)
    else:
        # Marketplace default: hide rejected deals.
        stmt = stmt.where(Loan.status != "rejected")
    if industry:
        stmt = stmt.where(Loan.industry == industry)
    if trade_type:
        stmt = stmt.where(Loan.trade_type == trade_type)
    if risk_grade:
        stmt = stmt.where(Loan.risk_grade == risk_grade)
    if owner_user_id:
        stmt = stmt.where(Loan.owner_user_id == owner_user_id)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Loan.title.ilike(term),
                Loan.goods.ilike(term),
                Loan.description.ilike(term),
                Company.name.ilike(term),
            )
        )

    stmt = stmt.order_by(_SORTS.get(sort, Loan.created_at.desc())).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def list_distinct_industries(db: AsyncSession) -> list[str]:
    result = await db.execute(select(Loan.industry).distinct().order_by(Loan.industry))
    return [row for row in result.scalars().all() if row]


async def count_loans(db: AsyncSession) -> int:
    result = await db.execute(select(func.count()).select_from(Loan))
    return int(result.scalar_one())


async def update_loan(db: AsyncSession, loan: Loan, **changes) -> Loan:
    for key, value in changes.items():
        setattr(loan, key, value)
    await db.flush()
    await db.refresh(loan)
    return loan
