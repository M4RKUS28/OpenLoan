import uuid
from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.bid import Bid


async def create_bid(db: AsyncSession, **kwargs) -> Bid:
    bid = Bid(**kwargs)
    db.add(bid)
    await db.flush()
    await db.refresh(bid)
    return bid


async def get_bid(db: AsyncSession, bid_id: uuid.UUID) -> Bid | None:
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    return result.scalar_one_or_none()


async def list_bids_for_loan(db: AsyncSession, loan_id: uuid.UUID) -> Sequence[Bid]:
    result = await db.execute(
        select(Bid).where(Bid.loan_id == loan_id).order_by(Bid.interest_rate.asc())
    )
    return result.scalars().all()


async def list_bids_for_lender(
    db: AsyncSession, lender_user_id: str, offset: int = 0, limit: int = 100
) -> Sequence[Bid]:
    result = await db.execute(
        select(Bid)
        .where(Bid.lender_user_id == lender_user_id)
        .order_by(Bid.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


async def set_bid_status(db: AsyncSession, bid: Bid, status: str) -> Bid:
    bid.status = status
    await db.flush()
    await db.refresh(bid)
    return bid


async def reject_other_bids(db: AsyncSession, loan_id: uuid.UUID, keep_bid_id: uuid.UUID) -> None:
    """Mark every other pending bid on a loan as rejected once one is accepted."""
    await db.execute(
        update(Bid)
        .where(Bid.loan_id == loan_id, Bid.id != keep_bid_id, Bid.status == "pending")
        .values(status="rejected")
    )
