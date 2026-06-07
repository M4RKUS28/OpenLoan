from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, PositiveInt, StrictStr


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["mock-cdi-api"]


class Consent(BaseModel):
    consent_id: str = Field(..., min_length=1)
    scopes: list[StrictStr] = Field(..., min_length=1)


class Borrower(BaseModel):
    platform_borrower_id: str = Field(..., min_length=1)
    legal_name: str = Field(..., min_length=1)
    hong_kong_business_registration_number: str = Field(..., min_length=1)
    company_registry_number: str | None = None
    registered_address: str = Field(..., min_length=1)


class LoanRequest(BaseModel):
    loan_amount_hkd: PositiveInt
    loan_duration_days: PositiveInt
    loan_purpose: str = Field(..., min_length=1)
    expected_repayment_source: str = Field(..., min_length=1)


class PurchaseOrder(BaseModel):
    po_number: str = Field(..., min_length=1)
    po_date: date
    po_value_hkd: PositiveInt


class Invoice(BaseModel):
    invoice_number: str = Field(..., min_length=1)
    invoice_date: date
    invoice_value_hkd: PositiveInt
    invoice_file_hash: str | None = None


class Supplier(BaseModel):
    supplier_name: str = Field(..., min_length=1)
    supplier_country: str = Field(..., min_length=2)
    supplier_registration_id: str | None = None


class Goods(BaseModel):
    product_type: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    quantity: PositiveInt
    declared_goods_value_hkd: PositiveInt


class Shipment(BaseModel):
    transport_mode: str = Field(..., min_length=1)
    origin_port: str = Field(..., min_length=1)
    destination_port: str = Field(..., min_length=1)
    expected_departure_date: date
    expected_arrival_date: date
    bill_of_lading_number: str = Field(..., min_length=1)
    container_numbers: list[str] = Field(default_factory=list)


class SalesContext(BaseModel):
    expected_sales_channel: str = Field(..., min_length=1)
    primary_marketplace: str | None = None
    expected_sell_through_days: PositiveInt


class DeclaredTransaction(BaseModel):
    purchase_order: PurchaseOrder
    invoice: Invoice
    supplier: Supplier
    goods: Goods
    shipment: Shipment
    sales_context: SalesContext


class TransactionRiskEnrichmentRequest(BaseModel):
    request_id: str = Field(..., min_length=1)
    consent: Consent
    borrower: Borrower
    loan_request: LoanRequest
    declared_transaction: DeclaredTransaction


class BorrowerMatch(BaseModel):
    matched: bool
    match_confidence: float = Field(..., ge=0, le=1)
    matched_business_registration_number: str
    matched_company_name: str


class AmountConsistency(BaseModel):
    declared_invoice_value_hkd: int = Field(..., ge=0)
    matched_trade_value_hkd: int = Field(..., ge=0)
    variance_percent: float = Field(..., ge=0)
    within_tolerance: bool


class ShipmentTimeline(BaseModel):
    cargo_booking_date: date
    actual_departure_date: date
    estimated_arrival_date: date


class TradeShipmentVerificationRisk(BaseModel):
    score_0_100: int = Field(..., ge=0, le=100)
    status: str
    shipment_status: str
    invoice_match: bool
    purchase_order_match: bool
    customs_declaration_match: bool
    bill_of_lading_match: bool
    amount_consistency: AmountConsistency
    shipment_timeline: ShipmentTimeline
    evidence_summary: list[str]
    reason_codes: list[str]


class SupplierMatch(BaseModel):
    matched: bool
    supplier_name: str
    supplier_country: str


class PriorRelationshipWithBorrower(BaseModel):
    observed: bool
    completed_shipments_between_parties: int = Field(..., ge=0)
    average_delay_days_between_parties: float = Field(..., ge=0)


class SupplierReliabilityRisk(BaseModel):
    score_0_100: int = Field(..., ge=0, le=100)
    supplier_match: SupplierMatch
    history_window_months: PositiveInt
    completed_shipments: int = Field(..., ge=0)
    on_time_delivery_rate: float = Field(..., ge=0, le=1)
    average_delay_days: float = Field(..., ge=0)
    dispute_rate: float = Field(..., ge=0, le=1)
    cancellation_rate: float = Field(..., ge=0, le=1)
    prior_relationship_with_borrower: PriorRelationshipWithBorrower
    evidence_summary: list[str]
    reason_codes: list[str]


class SupplierNormality(BaseModel):
    same_supplier_seen_before: bool
    supplier_frequency_percentile: int = Field(..., ge=0, le=100)


class RouteNormality(BaseModel):
    route_seen_before: bool
    route_frequency_percentile: int = Field(..., ge=0, le=100)


class CargoTypeNormality(BaseModel):
    product_type_seen_before: bool
    product_type_frequency_percentile: int = Field(..., ge=0, le=100)


class ShipmentSizeNormality(BaseModel):
    current_declared_value_hkd: int = Field(..., ge=0)
    borrower_median_shipment_value_hkd: int = Field(..., ge=0)
    value_vs_median_ratio: float = Field(..., ge=0)
    size_z_score: float = Field(..., ge=0)


class TenorNormality(BaseModel):
    requested_loan_duration_days: PositiveInt
    observed_average_cash_cycle_days: PositiveInt
    duration_vs_observed_cycle: float = Field(..., ge=0)


class OrderNormalityRisk(BaseModel):
    score_0_100: int = Field(..., ge=0, le=100)
    basis: Literal["borrower_historical_trade_patterns"]
    history_window_months: PositiveInt
    supplier_normality: SupplierNormality
    route_normality: RouteNormality
    cargo_type_normality: CargoTypeNormality
    shipment_size_normality: ShipmentSizeNormality
    tenor_normality: TenorNormality
    evidence_summary: list[str]
    reason_codes: list[str]


class ChannelDistribution(BaseModel):
    channel: str
    revenue_share: float = Field(..., ge=0, le=1)


class BuyerChannelConcentrationRisk(BaseModel):
    score_0_100: int = Field(..., ge=0, le=100)
    basis: Literal["sales_channel_summary"]
    history_window_months: PositiveInt
    channel_distribution: list[ChannelDistribution]
    largest_channel_share: float = Field(..., ge=0, le=1)
    top_three_channel_share: float = Field(..., ge=0, le=1)
    channel_hhi: float = Field(..., ge=0, le=1)
    concentration_level: str
    evidence_summary: list[str]
    reason_codes: list[str]


class RiskSignals(BaseModel):
    trade_shipment_verification: TradeShipmentVerificationRisk
    supplier_reliability: SupplierReliabilityRisk
    order_normality: OrderNormalityRisk
    buyer_channel_concentration: BuyerChannelConcentrationRisk


class HardStopFlag(BaseModel):
    code: str
    severity: Literal["block", "warning"]
    message: str


class TransactionRiskEnrichmentResponse(BaseModel):
    cdi_request_id: str
    request_id: str
    response_generated_at: datetime
    borrower_match: BorrowerMatch
    risk_signals: RiskSignals
    hard_stop_flags: list[HardStopFlag]
    data_limitations: list[str]
