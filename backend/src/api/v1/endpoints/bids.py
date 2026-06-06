from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.endpoints.loans import _build_summary
from src.api.v1.schemas.bid import BidResponse
from src.api.v1.schemas.loan import MyBidResponse
from src.core.auth import TokenData, get_current_user
from src.db.crud.loan import get_loan
from src.db.database import get_db
from src.services.bid_service import list_my_bids

router = APIRouter(prefix="/bids", tags=["bids"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[TokenData, Depends(get_current_user)]


@router.get("/mine", response_model=list[MyBidResponse])
async def my_bids(db: DbDep, user: UserDep):
    bids = await list_my_bids(db, user.user_id)
    loan_cache: dict = {}
    out: list[MyBidResponse] = []
    for bid in bids:
        loan = loan_cache.get(bid.loan_id)
        if loan is None:
            loan = await get_loan(db, bid.loan_id)
            loan_cache[bid.loan_id] = loan
        if loan is None:
            continue
        out.append(
            MyBidResponse(bid=BidResponse.model_validate(bid), loan=_build_summary(loan))
        )
    return out
