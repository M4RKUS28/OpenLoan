import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import TokenData
from src.core.exceptions import AppError, ForbiddenError, NotFoundError
from src.db.crud.bid import (
    create_bid,
    get_bid,
    list_bids_for_lender,
    list_bids_for_loan,
    reject_other_bids,
    set_bid_status,
)
from src.db.models.bid import Bid
from src.services.loan_service import get_loan_or_404


async def place_bid(db: AsyncSession, loan_id: uuid.UUID, user: TokenData, data: dict) -> Bid:
    loan = await get_loan_or_404(db, loan_id)
    if loan.status != "open":
        raise AppError(400, "This deal is not open for bidding")
    if loan.owner_user_id == user.user_id:
        raise AppError(400, "You cannot fund your own deal")

    lender_name = user.username or user.email or "Investor"
    return await create_bid(
        db,
        loan_id=loan_id,
        lender_user_id=user.user_id,
        lender_name=lender_name,
        amount=data["amount"],
        interest_rate=data["interest_rate"],
        message=data.get("message"),
        status="pending",
    )


async def list_loan_bids(db: AsyncSession, loan_id: uuid.UUID) -> Sequence[Bid]:
    return await list_bids_for_loan(db, loan_id)


async def list_my_bids(db: AsyncSession, user_id: str) -> Sequence[Bid]:
    return await list_bids_for_lender(db, user_id)


async def accept_bid(db: AsyncSession, loan_id: uuid.UUID, bid_id: uuid.UUID, user: TokenData):
    """Loan owner accepts a bid: deal becomes funded, other bids are rejected."""
    # Imported here to avoid a circular import at module load.
    from src.db.crud.loan import update_loan

    loan = await get_loan_or_404(db, loan_id)
    if loan.owner_user_id != user.user_id:
        raise ForbiddenError()
    if loan.status != "open":
        raise AppError(400, "Only open deals can be funded")

    bid = await get_bid(db, bid_id)
    if not bid or bid.loan_id != loan_id:
        raise NotFoundError("Bid")
    if bid.status != "pending":
        raise AppError(400, "This bid is no longer available")

    await set_bid_status(db, bid, "accepted")
    await reject_other_bids(db, loan_id, keep_bid_id=bid_id)
    loan = await update_loan(
        db,
        loan,
        status="funded",
        funded_amount=bid.amount,
        interest_rate=bid.interest_rate,
    )
    return loan, bid
