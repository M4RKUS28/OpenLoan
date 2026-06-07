from .types import (
    CdiConsentScope,
    Collateral,
    CollateralType,
    DemoScenario,
    Goods,
    Invoice,
    LoanApplicationInput,
    LoanRequest,
    LoanScoringInput,
    PurchaseOrder,
    ScoringSalesContext,
    Shipment,
    Supplier,
    Transaction,
    TransportMode,
)
from .utils import add_days_iso, hash_token, seeded_int

DEMO_BASE_DATE_ISO = "2026-06-07"
ALL_CDI_SCOPES: list[CdiConsentScope] = [
    "trade_records",
    "cargo_records",
    "customs_declarations",
    "supplier_history",
    "sales_channel_summary",
]
SCENARIO_INVOICE_DIGIT: dict[DemoScenario, str] = {
    "strong": "2",
    "medium": "5",
    "weak": "8",
    "hard_stop": "9",
}


def invent_loan_scoring_input(input_data: LoanApplicationInput) -> LoanScoringInput:
    supplier_country = input_data.supplier_country.strip().upper()
    scenario = input_data.demo_scenario or _infer_demo_scenario(input_data)
    seed = "|".join(
        [
            input_data.borrower_id,
            input_data.supplier_name,
            str(input_data.invoice_value_hkd),
        ]
    )
    token = hash_token(seed, 8).upper()
    po_date = add_days_iso(DEMO_BASE_DATE_ISO, -seeded_int(f"{seed}|po-age", 4, 16))
    invoice_date = add_days_iso(po_date, seeded_int(f"{seed}|invoice-lag", 1, 3))
    departure_date = add_days_iso(
        DEMO_BASE_DATE_ISO,
        seeded_int(f"{seed}|departure", 2, 8),
    )
    delivery_days = max(1, round(input_data.expected_delivery_days or 1))
    transport_mode = _choose_transport_mode(supplier_country, delivery_days)
    collateral_value = _infer_collateral_value(
        input_data.collateral.type,
        input_data.collateral.value_hkd,
        input_data.loan_amount_hkd,
        input_data.invoice_value_hkd,
    )

    return LoanScoringInput(
        request_id=f"loanreq_demo_{token}",
        borrower_id=input_data.borrower_id.strip(),
        loan_request=LoanRequest(
            loan_amount_hkd=float(input_data.loan_amount_hkd),
            loan_duration_days=int(input_data.loan_duration_days),
            expected_repayment_source=input_data.expected_repayment_source,
        ),
        transaction=Transaction(
            purchase_order=PurchaseOrder(
                po_number=f"PO-DEMO-{token}",
                po_date=po_date,
                po_value_hkd=float(input_data.purchase_order_value_hkd),
            ),
            invoice=Invoice(
                invoice_number=f"INV-DEMO-{token}{SCENARIO_INVOICE_DIGIT[scenario]}",
                invoice_date=invoice_date,
                invoice_value_hkd=float(input_data.invoice_value_hkd),
            ),
            supplier=Supplier(
                supplier_name=input_data.supplier_name.strip(),
                supplier_country=supplier_country,
                supplier_registration_id=_supplier_registration_id(
                    supplier_country,
                    input_data.supplier_name,
                    token,
                ),
            ),
            goods=Goods(
                product_type=input_data.product_type.strip(),
                description=input_data.goods_description or _humanize_product_type(
                    input_data.product_type
                ),
                quantity=_infer_quantity(
                    input_data.quantity,
                    input_data.invoice_value_hkd,
                    input_data.product_type,
                    seed,
                ),
                declared_goods_value_hkd=float(input_data.invoice_value_hkd),
            ),
            shipment=_build_shipment(
                transport_mode,
                supplier_country,
                departure_date,
                delivery_days,
                token,
            ),
            collateral=_build_collateral(input_data.collateral.type, collateral_value, token),
            sales_context=_build_sales_context(input_data, seed),
        ),
        cdi_consent={
            "consent_id": f"consent_demo_{hash_token(f'{seed}|consent', 10).upper()}",
            "scopes": ALL_CDI_SCOPES,
        },
    )


def _infer_demo_scenario(input_data: LoanApplicationInput) -> DemoScenario:
    has_collateral = input_data.collateral.type != "none"
    invoice_value = input_data.invoice_value_hkd
    loan_amount = input_data.loan_amount_hkd
    if (
        has_collateral
        and invoice_value > 0
        and loan_amount <= invoice_value * 0.75
        and input_data.loan_duration_days <= 60
    ):
        return "strong"
    if invoice_value > 0 and loan_amount <= invoice_value * 0.9:
        return "medium"
    return "weak"


def _build_sales_context(
    input_data: LoanApplicationInput,
    seed: str,
) -> ScoringSalesContext:
    sales_context = input_data.sales_context
    sell_through_days = max(
        14,
        min(
            150,
            input_data.loan_duration_days - 7
            if input_data.loan_duration_days > 7
            else seeded_int(f"{seed}|sell-through", 30, 75),
        ),
    )
    return ScoringSalesContext(
        expected_sales_channel=(
            sales_context.expected_sales_channel if sales_context else "other"
        ),
        primary_marketplace=sales_context.primary_marketplace if sales_context else None,
        expected_sell_through_days=sell_through_days,
    )


def _build_shipment(
    transport_mode: TransportMode,
    supplier_country: str,
    departure_date: str,
    delivery_days: int,
    token: str,
) -> Shipment:
    shipment = Shipment(
        transport_mode=transport_mode,
        origin_port=_origin_port_for_country(supplier_country),
        destination_port="Hong Kong",
        expected_departure_date=departure_date,
        expected_arrival_date=add_days_iso(departure_date, delivery_days),
        bill_of_lading_number=f"BL-{supplier_country}-HKG-{token}",
    )
    if transport_mode == "air":
        shipment.air_waybill_number = f"AWB-{supplier_country}-HKG-{token}"
    else:
        shipment.container_numbers = [f"TEMU{_numeric_token(token, 7)}"]
    return shipment


def _build_collateral(
    collateral_type: CollateralType,
    value_hkd: float,
    token: str,
) -> Collateral:
    collateral = Collateral(type=collateral_type, value_hkd=value_hkd)
    if collateral_type == "insured_goods":
        collateral.insurance_policy_number = f"INS-HKG-{token}"
    if collateral_type == "warehouse_receipt":
        collateral.warehouse_receipt_number = f"WHR-HKG-{token}"
    return collateral


def _infer_collateral_value(
    collateral_type: CollateralType,
    supplied_value: float | None,
    loan_amount: float,
    invoice_value: float,
) -> float:
    if supplied_value is not None:
        return max(0, float(supplied_value))
    if collateral_type == "none":
        return 0
    if collateral_type == "cash_deposit":
        return max(0, round(loan_amount))
    if collateral_type in {"warehouse_receipt", "insured_goods"}:
        return max(0, round(invoice_value))
    return max(0, round(min(invoice_value, loan_amount * 0.75)))


def _infer_quantity(
    supplied_quantity: int | None,
    invoice_value: float,
    product_type: str,
    seed: str,
) -> int:
    if supplied_quantity is not None and supplied_quantity > 0:
        return round(supplied_quantity)

    unit_values = [
        ("electronics", 120),
        ("apparel", 85),
        ("fashion", 85),
        ("restaurant_equipment", 1_250),
        ("industrial", 750),
        ("food", 55),
    ]
    normalized_product = product_type.lower()
    unit_value = next(
        (
            value
            for product_key, value in unit_values
            if product_key in normalized_product
        ),
        seeded_int(f"{seed}|unit-value", 90, 240),
    )
    return max(1, round(max(1, invoice_value) / unit_value))


def _choose_transport_mode(supplier_country: str, delivery_days: int) -> TransportMode:
    if supplier_country == "CN" and delivery_days <= 7:
        return "road"
    if delivery_days <= 5:
        return "air"
    return "sea"


def _origin_port_for_country(country: str) -> str:
    ports = {
        "CN": "Yantian",
        "HK": "Hong Kong",
        "MO": "Macau",
        "TW": "Kaohsiung",
        "VN": "Hai Phong",
        "MY": "Port Klang",
        "TH": "Laem Chabang",
        "ID": "Tanjung Priok",
        "SG": "Singapore",
    }
    return ports.get(country, f"{country} Export Terminal")


def _supplier_registration_id(country: str, supplier_name: str, token: str) -> str:
    country_prefix = "".join(character for character in country if character.isalpha())[:3]
    name_token = hash_token(f"{supplier_name}|registration", 6).upper()
    return f"{country_prefix or 'INT'}-{name_token}-{token[:4]}"


def _humanize_product_type(product_type: str) -> str:
    return " ".join(word.capitalize() for word in product_type.replace("-", "_").split("_") if word)


def _numeric_token(token: str, length: int) -> str:
    digits = "".join(str(ord(character) % 10) for character in token)
    return digits.ljust(length, "0")[:length]
