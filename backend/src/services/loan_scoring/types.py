from typing import Any, Literal

from pydantic import BaseModel, Field

ExpectedRepaymentSource = Literal[
    "inventory_sales",
    "buyer_receivable",
    "marketplace_sales",
    "other",
]
CollateralType = Literal[
    "none",
    "cash_deposit",
    "inventory",
    "insured_goods",
    "warehouse_receipt",
]
ExpectedSalesChannel = Literal[
    "marketplace",
    "own_website",
    "physical_store",
    "distributor",
    "mixed",
    "other",
]
DemoScenario = Literal["strong", "medium", "weak", "hard_stop"]
TransportMode = Literal["sea", "air", "road", "rail"]
CdiConsentScope = Literal[
    "trade_records",
    "cargo_records",
    "customs_declarations",
    "supplier_history",
    "sales_channel_summary",
]
RiskGrade = Literal["A", "B", "C", "D", "E"]


class LoanApplicationCollateral(BaseModel):
    type: CollateralType
    value_hkd: float | None = None


class LoanApplicationSalesContext(BaseModel):
    expected_sales_channel: ExpectedSalesChannel
    primary_marketplace: str | None = None


class LoanApplicationInput(BaseModel):
    borrower_id: str
    loan_amount_hkd: float
    loan_duration_days: int
    purchase_order_value_hkd: float
    invoice_value_hkd: float
    supplier_name: str
    supplier_country: str
    product_type: str
    goods_description: str | None = None
    quantity: int | None = None
    expected_delivery_days: int
    expected_repayment_source: ExpectedRepaymentSource
    collateral: LoanApplicationCollateral
    sales_context: LoanApplicationSalesContext | None = None
    demo_scenario: DemoScenario | None = None


class LoanRequest(BaseModel):
    loan_amount_hkd: float
    loan_duration_days: int
    expected_repayment_source: ExpectedRepaymentSource


class PurchaseOrder(BaseModel):
    po_number: str
    po_date: str
    po_value_hkd: float


class Invoice(BaseModel):
    invoice_number: str
    invoice_date: str
    invoice_value_hkd: float


class Supplier(BaseModel):
    supplier_name: str
    supplier_country: str
    supplier_registration_id: str


class Goods(BaseModel):
    product_type: str
    description: str | None = None
    quantity: int | None = None
    declared_goods_value_hkd: float


class Shipment(BaseModel):
    transport_mode: TransportMode
    origin_port: str
    destination_port: str
    expected_departure_date: str
    expected_arrival_date: str
    bill_of_lading_number: str | None = None
    air_waybill_number: str | None = None
    container_numbers: list[str] | None = None


class Collateral(BaseModel):
    type: CollateralType
    value_hkd: float
    insurance_policy_number: str | None = None
    warehouse_receipt_number: str | None = None


class ScoringSalesContext(BaseModel):
    expected_sales_channel: ExpectedSalesChannel
    primary_marketplace: str | None = None
    expected_sell_through_days: int | None = None


class Transaction(BaseModel):
    purchase_order: PurchaseOrder
    invoice: Invoice
    supplier: Supplier
    goods: Goods
    shipment: Shipment
    collateral: Collateral
    sales_context: ScoringSalesContext | None = None


class CdiConsent(BaseModel):
    consent_id: str
    scopes: list[CdiConsentScope]


class LoanScoringInput(BaseModel):
    request_id: str
    borrower_id: str
    loan_request: LoanRequest
    transaction: Transaction
    cdi_consent: CdiConsent


class ScoreComponent(BaseModel):
    key: str
    label: str
    weight_percent: float
    raw_score_0_100: float
    weighted_points: float


class LoanScoreResult(BaseModel):
    request_id: str
    borrower_id: str
    total_score: float
    borrower_score: float
    transaction_score: float
    showstopper: str | None
    borrower_components: list[ScoreComponent]
    transaction_components: list[ScoreComponent]


class CreditScore(BaseModel):
    total_score: float
    grade: RiskGrade
    borrower_score: float
    transaction_score: float
    showstopper: str | None
    borrower_components: list[ScoreComponent]
    transaction_components: list[ScoreComponent]


class BorrowerProfile(BaseModel):
    legal_name: str
    hong_kong_business_registration_number: str
    company_registry_number: str | None = None
    registered_address: str | None = None


class BorrowerComponentScores(BaseModel):
    repayment_history: float
    current_platform_exposure: float
    business_age_continuity: float
    legal_compliance: float
    kyb_consistency: float
    cdi_activity_continuity: float


class PlatformHistory(BaseModel):
    median_invoice_value_hkd: float
    usual_loan_duration_days: int
    common_product_types: list[str]
    common_supplier_countries: list[str]


class BorrowerScoreRecord(BaseModel):
    borrower_id: str
    borrower_profile: BorrowerProfile
    component_scores: BorrowerComponentScores
    platform_history: PlatformHistory | None = None


class CdiCallResult(BaseModel):
    response: dict[str, Any] | None = None
    unavailable: bool = False


class ScoreComponentDefinition(BaseModel):
    key: str
    label: str
    weight_percent: float = Field(ge=0)
