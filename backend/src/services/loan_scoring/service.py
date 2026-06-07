from decimal import Decimal
from typing import Any

from .cdi_client import fetch_cdi_transaction_risk_enrichment
from .grade import grade_from_score
from .invent import invent_loan_scoring_input
from .mock_borrower_db import get_borrower_score_record
from .scoring_rules import (
    TRANSACTION_COMPONENT_DEFINITIONS,
    build_borrower_score_components,
    build_local_transaction_components,
    build_score_component,
    get_internal_showstopper,
    sum_weighted_points,
    transaction_definition,
)
from .types import (
    CreditScore,
    DemoScenario,
    LoanApplicationCollateral,
    LoanApplicationInput,
    LoanApplicationSalesContext,
    LoanScoreResult,
    LoanScoringInput,
    ScoreComponent,
)


async def score_loan_request(input_data: LoanScoringInput) -> LoanScoreResult:
    borrower_record = get_borrower_score_record(input_data.borrower_id)
    borrower_components = build_borrower_score_components(borrower_record)
    local_components, local_showstopper = build_local_transaction_components(
        input_data,
        borrower_record,
    )
    showstopper = get_internal_showstopper(input_data) or local_showstopper

    cdi_result = await fetch_cdi_transaction_risk_enrichment(input_data, borrower_record)
    if cdi_result.unavailable and not showstopper:
        showstopper = "CDI mock API unavailable."

    cdi_response = cdi_result.response
    cdi_hard_stop = None
    if cdi_response:
        hard_stop_flags = cdi_response.get("hard_stop_flags") or []
        if hard_stop_flags:
            cdi_hard_stop = hard_stop_flags[0].get("message")
    if cdi_hard_stop:
        showstopper = cdi_hard_stop

    cdi_components = _build_cdi_transaction_components(cdi_response)
    transaction_components = [
        local_components.get(definition.key)
        or cdi_components.get(definition.key)
        or build_score_component(definition, 0)
        for definition in TRANSACTION_COMPONENT_DEFINITIONS
    ]
    borrower_score = sum_weighted_points(borrower_components)
    transaction_score = sum_weighted_points(transaction_components)
    total_score = round(borrower_score + transaction_score, 2)

    return LoanScoreResult(
        request_id=input_data.request_id,
        borrower_id=input_data.borrower_id,
        total_score=total_score,
        borrower_score=borrower_score,
        transaction_score=transaction_score,
        showstopper=showstopper,
        borrower_components=borrower_components,
        transaction_components=transaction_components,
    )


async def score_loan_application(
    input_data: LoanApplicationInput,
) -> tuple[LoanScoringInput, CreditScore]:
    expanded_input = invent_loan_scoring_input(input_data)
    result = await score_loan_request(expanded_input)
    return expanded_input, credit_score_from_result(result)


def credit_score_from_result(result: LoanScoreResult) -> CreditScore:
    return CreditScore(
        total_score=result.total_score,
        grade=grade_from_score(result.total_score),
        borrower_score=result.borrower_score,
        transaction_score=result.transaction_score,
        showstopper=result.showstopper,
        borrower_components=result.borrower_components,
        transaction_components=result.transaction_components,
    )


def loan_application_from_create_payload(
    data: dict[str, Any],
    *,
    company_name: str = "",
    company_industry: str = "",
) -> LoanApplicationInput:
    scenario = _scenario(data.get("demo_scenario"))
    loan_amount = _number(data.get("loan_amount_hkd") or data.get("amount") or 0)
    duration = int(_number(data.get("loan_duration_days") or data.get("term_days") or 60))
    invoice_value = _number(
        data.get("invoice_value_hkd")
        or _invoice_value_from_amount(loan_amount, scenario)
    )
    purchase_order_value = _number(data.get("purchase_order_value_hkd") or invoice_value)
    product_type = _text(
        data.get("product_type"),
        _product_type_from_text(" ".join([company_industry, data.get("goods") or ""])),
    )
    supplier_country = _text(
        data.get("supplier_country"),
        _supplier_country_from_origin(data.get("origin_country")),
    ).upper()
    collateral_payload = data.get("collateral") or {}
    sales_context_payload = data.get("sales_context") or {}

    return LoanApplicationInput(
        borrower_id=_text(
            data.get("borrower_id"),
            _borrower_id_from_text(company_name, company_industry),
        ),
        loan_amount_hkd=loan_amount,
        loan_duration_days=duration,
        purchase_order_value_hkd=purchase_order_value,
        invoice_value_hkd=invoice_value,
        supplier_name=_text(
            data.get("supplier_name"),
            _supplier_name_from_country(supplier_country, product_type),
        ),
        supplier_country=supplier_country,
        product_type=product_type,
        goods_description=_text(
            data.get("goods_description"),
            data.get("goods") or product_type.replace("_", " "),
        ),
        quantity=_optional_int(data.get("quantity"))
        or max(1, round(invoice_value / _unit_value_for_product(product_type))),
        expected_delivery_days=int(_number(data.get("expected_delivery_days") or 7)),
        expected_repayment_source=data.get("expected_repayment_source")
        or _repayment_source_for_scenario(scenario),
        collateral=LoanApplicationCollateral(
            type=collateral_payload.get("type") or _collateral_type_for_scenario(scenario),
            value_hkd=_optional_number(collateral_payload.get("value_hkd")),
        ),
        sales_context=LoanApplicationSalesContext(
            expected_sales_channel=sales_context_payload.get("expected_sales_channel")
            or _sales_channel_for_scenario(scenario),
            primary_marketplace=sales_context_payload.get("primary_marketplace"),
        ),
        demo_scenario=scenario,
    )


def _build_cdi_transaction_components(
    cdi_response: dict[str, Any] | None,
) -> dict[str, ScoreComponent]:
    risk_signals = cdi_response.get("risk_signals") if cdi_response else {}
    return {
        "verified_trade_shipment": build_score_component(
            transaction_definition("verified_trade_shipment"),
            _nested_score(risk_signals, "trade_shipment_verification"),
        ),
        "supplier_reliability": build_score_component(
            transaction_definition("supplier_reliability"),
            _nested_score(risk_signals, "supplier_reliability"),
        ),
        "cdi_order_normality": build_score_component(
            transaction_definition("cdi_order_normality"),
            _nested_score(risk_signals, "order_normality"),
        ),
        "buyer_channel_concentration": build_score_component(
            transaction_definition("buyer_channel_concentration"),
            _nested_score(risk_signals, "buyer_channel_concentration"),
        ),
    }


def _nested_score(risk_signals: dict | None, key: str) -> float:
    if not risk_signals:
        return 0
    return float((risk_signals.get(key) or {}).get("score_0_100") or 0)


def _text(value: object, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _number(value: object) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str) and value.strip():
        return float(value)
    return 0


def _optional_number(value: object) -> float | None:
    if value in (None, ""):
        return None
    return _number(value)


def _optional_int(value: object) -> int | None:
    number = _optional_number(value)
    return round(number) if number and number > 0 else None


def _scenario(value: object) -> DemoScenario:
    if value in {"strong", "medium", "weak", "hard_stop"}:
        return value
    return "medium"


def _invoice_value_from_amount(loan_amount: float, scenario: DemoScenario) -> float:
    advance_rate = {"strong": 0.7, "medium": 0.83, "weak": 0.95, "hard_stop": 0.68}[scenario]
    return round(loan_amount / advance_rate) if loan_amount > 0 else 1


def _product_type_from_text(text: str) -> str:
    normalized = text.lower()
    if any(word in normalized for word in ("apparel", "textile", "garment")):
        return "apparel_fashion_goods"
    if any(word in normalized for word in ("food", "seafood", "catering")):
        return "packaged_food"
    if "auto" in normalized or "industrial" in normalized:
        return "industrial_components"
    if "household" in normalized or "wholesale" in normalized:
        return "wholesale_household_goods"
    return "consumer_electronics_accessories"


def _supplier_country_from_origin(origin: object) -> str:
    text = str(origin or "").lower()
    if "vietnam" in text:
        return "VN"
    if "malaysia" in text:
        return "MY"
    if "taiwan" in text:
        return "TW"
    if "korea" in text:
        return "KR"
    if "japan" in text:
        return "JP"
    if "italy" in text:
        return "IT"
    return "CN"


def _supplier_name_from_country(country: str, product_type: str) -> str:
    names = {
        "CN": (
            "Shenzhen Pearl Electronics Co Ltd"
            if "electronics" in product_type
            else "Dongguan Trade Manufacturing Co Ltd"
        ),
        "VN": "Ho Chi Minh Fashion Manufacturing JSC",
        "MY": "Penang Household Manufacturing Sdn Bhd",
        "TW": "Taichung Commercial Kitchen Equipment Co Ltd",
        "KR": "Busan Consumer Goods Export Co Ltd",
        "JP": "Osaka Cold Chain Trading Co Ltd",
        "IT": "Milano Premium Textile Supply SRL",
    }
    return names.get(country, "Regional Trade Supplier Limited")


def _borrower_id_from_text(company_name: str, industry: str) -> str:
    text = f"{company_name} {industry}".lower()
    if "apparel" in text or "textile" in text:
        return "brw_002"
    if "food" in text or "catering" in text:
        return "brw_005"
    if "wholesale" in text or "auto" in text:
        return "brw_004"
    if "beauty" in text:
        return "brw_003"
    return "brw_001"


def _unit_value_for_product(product_type: str) -> int:
    if "apparel" in product_type:
        return 85
    if "food" in product_type:
        return 55
    if "industrial" in product_type:
        return 750
    if "restaurant" in product_type:
        return 1_250
    return 120


def _repayment_source_for_scenario(scenario: DemoScenario) -> str:
    if scenario == "strong":
        return "marketplace_sales"
    if scenario == "weak":
        return "inventory_sales"
    return "buyer_receivable"


def _collateral_type_for_scenario(scenario: DemoScenario) -> str:
    if scenario == "weak":
        return "none"
    if scenario == "strong" or scenario == "hard_stop":
        return "insured_goods"
    return "warehouse_receipt"


def _sales_channel_for_scenario(scenario: DemoScenario) -> str:
    if scenario == "strong":
        return "marketplace"
    if scenario == "weak":
        return "own_website"
    return "distributor"
