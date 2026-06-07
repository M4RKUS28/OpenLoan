from .types import (
    BorrowerScoreRecord,
    LoanScoringInput,
    ScoreComponent,
    ScoreComponentDefinition,
)
from .utils import clamp, days_between_iso, has_text, normalize_token, positive_number, round2

BORROWER_COMPONENT_DEFINITIONS = [
    ScoreComponentDefinition(
        key="repayment_history",
        label="Past repayment history on our platform",
        weight_percent=20,
    ),
    ScoreComponentDefinition(
        key="current_platform_exposure",
        label="Current exposure on our platform",
        weight_percent=10,
    ),
    ScoreComponentDefinition(
        key="business_age_continuity",
        label="Business age and operating continuity",
        weight_percent=5,
    ),
    ScoreComponentDefinition(
        key="legal_compliance",
        label="Legal/compliance status",
        weight_percent=4,
    ),
    ScoreComponentDefinition(
        key="kyb_consistency",
        label="Basic borrower identity and KYB consistency",
        weight_percent=2,
    ),
    ScoreComponentDefinition(
        key="cdi_activity_continuity",
        label="CDI-observed business activity continuity",
        weight_percent=4,
    ),
]

TRANSACTION_COMPONENT_DEFINITIONS = [
    ScoreComponentDefinition(
        key="loan_to_invoice_reasonableness",
        label="Loan-to-invoice / advance-rate reasonableness",
        weight_percent=8,
    ),
    ScoreComponentDefinition(
        key="collateral_recovery_quality",
        label="Collateral/recovery quality",
        weight_percent=10,
    ),
    ScoreComponentDefinition(
        key="platform_order_normality",
        label="Order normality based on our platform history",
        weight_percent=7,
    ),
    ScoreComponentDefinition(
        key="basic_transaction_completeness",
        label="Basic transaction completeness",
        weight_percent=5,
    ),
    ScoreComponentDefinition(
        key="verified_trade_shipment",
        label="Verified trade/shipment data",
        weight_percent=14,
    ),
    ScoreComponentDefinition(
        key="supplier_reliability",
        label="Supplier reliability",
        weight_percent=4,
    ),
    ScoreComponentDefinition(
        key="cdi_order_normality",
        label="CDI-based order normality",
        weight_percent=4,
    ),
    ScoreComponentDefinition(
        key="buyer_channel_concentration",
        label="Buyer/customer/channel concentration risk",
        weight_percent=3,
    ),
]


def build_score_component(
    definition: ScoreComponentDefinition,
    raw_score: float,
) -> ScoreComponent:
    raw_score_0_100 = round2(clamp(raw_score, 0, 100))
    return ScoreComponent(
        key=definition.key,
        label=definition.label,
        weight_percent=definition.weight_percent,
        raw_score_0_100=raw_score_0_100,
        weighted_points=round2(raw_score_0_100 * definition.weight_percent / 100),
    )


def build_borrower_score_components(record: BorrowerScoreRecord) -> list[ScoreComponent]:
    component_scores = record.component_scores.model_dump()
    return [
        build_score_component(definition, component_scores[definition.key])
        for definition in BORROWER_COMPONENT_DEFINITIONS
    ]


def get_internal_showstopper(input_data: LoanScoringInput) -> str | None:
    if input_data.loan_request.loan_amount_hkd <= 0:
        return "Loan amount must be positive."
    if input_data.loan_request.loan_duration_days <= 0:
        return "Loan duration must be positive."
    if input_data.transaction.invoice.invoice_value_hkd <= 0:
        return "Invoice value must be positive."
    if input_data.loan_request.loan_amount_hkd > input_data.transaction.invoice.invoice_value_hkd:
        return "Requested loan amount exceeds invoice value."
    return None


def build_local_transaction_components(
    input_data: LoanScoringInput,
    borrower_record: BorrowerScoreRecord,
) -> tuple[dict[str, ScoreComponent], str | None]:
    raw_score, showstopper = _score_loan_to_invoice_reasonableness(input_data)
    return (
        {
            "loan_to_invoice_reasonableness": build_score_component(
                _transaction_definition("loan_to_invoice_reasonableness"),
                raw_score,
            ),
            "collateral_recovery_quality": build_score_component(
                _transaction_definition("collateral_recovery_quality"),
                _score_collateral_recovery_quality(input_data),
            ),
            "platform_order_normality": build_score_component(
                _transaction_definition("platform_order_normality"),
                _score_platform_order_normality(input_data, borrower_record),
            ),
            "basic_transaction_completeness": build_score_component(
                _transaction_definition("basic_transaction_completeness"),
                _score_basic_transaction_completeness(input_data),
            ),
        },
        showstopper,
    )


def sum_weighted_points(components: list[ScoreComponent]) -> float:
    return round2(sum(component.weighted_points for component in components))


def transaction_definition(key: str) -> ScoreComponentDefinition:
    return _transaction_definition(key)


def _transaction_definition(key: str) -> ScoreComponentDefinition:
    for definition in TRANSACTION_COMPONENT_DEFINITIONS:
        if definition.key == key:
            return definition
    raise ValueError(f"Unknown transaction score component: {key}")


def _score_loan_to_invoice_reasonableness(
    input_data: LoanScoringInput,
) -> tuple[float, str | None]:
    loan_amount = input_data.loan_request.loan_amount_hkd
    invoice_value = input_data.transaction.invoice.invoice_value_hkd
    if invoice_value <= 0 or loan_amount <= 0:
        return 0, None

    advance_rate = loan_amount / invoice_value
    if advance_rate <= 0.60:
        return 95, None
    if advance_rate <= 0.75:
        return 85, None
    if advance_rate <= 0.90:
        return 65, None
    if advance_rate <= 1.00:
        return 40, None
    return 10, "Requested loan amount exceeds invoice value."


def _score_collateral_recovery_quality(input_data: LoanScoringInput) -> float:
    collateral = input_data.transaction.collateral
    loan_amount = input_data.loan_request.loan_amount_hkd
    base_by_type = {
        "cash_deposit": 95,
        "warehouse_receipt": 85,
        "insured_goods": 75,
        "inventory": 55,
        "none": 25,
    }
    base_score = base_by_type[collateral.type]
    coverage = max(0, collateral.value_hkd) / loan_amount if loan_amount > 0 else 0

    if coverage >= 1:
        return base_score
    if coverage >= 0.75:
        return clamp(base_score - 5, 0, 100)
    if coverage >= 0.5:
        return clamp(base_score - 15, 0, 100)
    if coverage > 0:
        return clamp(base_score - 30, 0, 100)
    return min(base_score, 20)


def _score_platform_order_normality(
    input_data: LoanScoringInput,
    borrower_record: BorrowerScoreRecord,
) -> float:
    history = borrower_record.platform_history
    if not history:
        return 45

    score = 100
    invoice_value = input_data.transaction.invoice.invoice_value_hkd
    if history.median_invoice_value_hkd > 0:
        if invoice_value > history.median_invoice_value_hkd * 2.5:
            score -= 35
        elif invoice_value > history.median_invoice_value_hkd * 1.5:
            score -= 15

    loan_duration = input_data.loan_request.loan_duration_days
    if history.usual_loan_duration_days > 0:
        if loan_duration > history.usual_loan_duration_days * 1.75:
            score -= 20
        elif loan_duration > history.usual_loan_duration_days * 1.25:
            score -= 10

    product_type = normalize_token(input_data.transaction.goods.product_type)
    supplier_country = input_data.transaction.supplier.supplier_country.strip().upper()
    common_product_types = [normalize_token(value) for value in history.common_product_types]
    common_supplier_countries = [
        value.strip().upper() for value in history.common_supplier_countries
    ]

    if product_type not in common_product_types:
        score -= 15
    if supplier_country not in common_supplier_countries:
        score -= 10
    return clamp(score, 0, 100)


def _score_basic_transaction_completeness(input_data: LoanScoringInput) -> float:
    shipment_days = days_between_iso(
        input_data.transaction.shipment.expected_departure_date,
        input_data.transaction.shipment.expected_arrival_date,
    )
    checks = [
        positive_number(input_data.transaction.purchase_order.po_value_hkd),
        positive_number(input_data.transaction.invoice.invoice_value_hkd),
        has_text(input_data.transaction.supplier.supplier_name),
        has_text(input_data.transaction.supplier.supplier_country),
        has_text(input_data.transaction.goods.product_type),
        shipment_days > 0,
        has_text(input_data.loan_request.expected_repayment_source),
        positive_number(input_data.loan_request.loan_amount_hkd),
        positive_number(input_data.loan_request.loan_duration_days),
    ]
    return clamp(100 - checks.count(False) * 10, 0, 100)
