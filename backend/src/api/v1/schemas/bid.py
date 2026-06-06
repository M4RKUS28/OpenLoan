import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BidCreateRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    interest_rate: float = Field(gt=0, le=100)
    message: str | None = Field(default=None, max_length=2000)


class BidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    loan_id: uuid.UUID
    lender_user_id: str
    lender_name: str
    amount: float
    interest_rate: float
    message: str | None = None
    status: str
    created_at: datetime


class BidListResponse(BaseModel):
    items: list[BidResponse]
