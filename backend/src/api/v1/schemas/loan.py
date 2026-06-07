from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from src.api.v1.schemas.bid import BidResponse
from src.api.v1.schemas.company import CompanySummary


class ScoreComponentResponse(BaseModel):
    key: str
    label: str
    weight_percent: float
    raw_score_0_100: float
    weighted_points: float


class CreditScoreResponse(BaseModel):
    total_score: float
    grade: Literal["A", "B", "C", "D", "E"]
    borrower_score: float
    transaction_score: float
    showstopper: str | None = None
    borrower_components: list[ScoreComponentResponse]
    transaction_components: list[ScoreComponentResponse]


class LoanApplicationCollateralRequest(BaseModel):
    type: Literal[
        "none",
        "cash_deposit",
        "inventory",
        "insured_goods",
        "warehouse_receipt",
    ]
    value_hkd: float | None = None


class LoanApplicationSalesContextRequest(BaseModel):
    expected_sales_channel: Literal[
        "marketplace",
        "own_website",
        "physical_store",
        "distributor",
        "mixed",
        "other",
    ]
    primary_marketplace: str | None = None


class LoanCreateRequest(BaseModel):
    title: str = Field(min_length=4, max_length=255)
    description: str | None = None
    purpose: str | None = Field(default=None, max_length=255)
    trade_type: str = Field(default="import", max_length=60)
    industry: str | None = Field(default=None, max_length=120)
    goods: str | None = Field(default=None, max_length=255)
    origin_country: str | None = Field(default=None, max_length=120)
    destination_country: str | None = Field(default=None, max_length=120)
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="HKD", max_length=8)
    term_days: int = Field(default=90, ge=7, le=365)
    interest_rate: float = Field(default=8.0, gt=0, le=100)
    auction_deadline: datetime | None = None

    # Backend-owned demo scoring input. The frontend may omit fields for legacy
    # callers; the service fills deterministic demo defaults before scoring.
    borrower_id: str | None = None
    loan_amount_hkd: Decimal | None = Field(default=None, gt=0)
    loan_duration_days: int | None = Field(default=None, ge=1)
    purchase_order_value_hkd: Decimal | None = Field(default=None, gt=0)
    invoice_value_hkd: Decimal | None = Field(default=None, gt=0)
    supplier_name: str | None = None
    supplier_country: str | None = None
    product_type: str | None = None
    goods_description: str | None = None
    quantity: int | None = Field(default=None, gt=0)
    expected_delivery_days: int | None = Field(default=None, ge=1)
    expected_repayment_source: Literal[
        "inventory_sales",
        "buyer_receivable",
        "marketplace_sales",
        "other",
    ] | None = None
    collateral: LoanApplicationCollateralRequest | None = None
    sales_context: LoanApplicationSalesContextRequest | None = None
    demo_scenario: Literal["strong", "medium", "weak", "hard_stop"] | None = None


class ScoreFactorResponse(BaseModel):
    key: str
    label: str
    description: str
    score: int
    weight: float


class ScoreResponse(BaseModel):
    score: int
    grade: str
    factors: list[ScoreFactorResponse]


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    category: str | None = None
    created_at: datetime
    download_url: str


class LoanSummary(BaseModel):
    id: uuid.UUID
    title: str
    goods: str | None = None
    purpose: str | None = None
    trade_type: str
    industry: str
    amount: float
    currency: str
    term_days: int
    interest_rate: float
    funded_amount: float
    status: str
    risk_score: int | None = None
    risk_grade: str | None = None
    auction_deadline: datetime | None = None
    created_at: datetime
    company: CompanySummary
    bid_count: int = 0
    best_rate: float | None = None


class LoanDetail(LoanSummary):
    description: str | None = None
    origin_country: str | None = None
    destination_country: str | None = None
    owner_user_id: str
    updated_at: datetime
    score: ScoreResponse
    credit_score: CreditScoreResponse | None = None
    loan_scoring_input: dict[str, Any] | None = None
    documents: list[DocumentResponse] = []
    bids: list[BidResponse] = []


class LoanListResponse(BaseModel):
    items: list[LoanSummary]


class MyBidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bid: BidResponse
    loan: LoanSummary


class IndustryListResponse(BaseModel):
    items: list[str]
