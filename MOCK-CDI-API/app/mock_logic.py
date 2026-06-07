from __future__ import annotations

import hashlib
import random
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.models import (
    AmountConsistency,
    BorrowerMatch,
    BuyerChannelConcentrationRisk,
    ChannelDistribution,
    HardStopFlag,
    OrderNormalityRisk,
    PriorRelationshipWithBorrower,
    RiskSignals,
    ShipmentSizeNormality,
    ShipmentTimeline,
    SupplierMatch,
    SupplierNormality,
    SupplierReliabilityRisk,
    TenorNormality,
    TradeShipmentVerificationRisk,
    TransactionRiskEnrichmentRequest,
    TransactionRiskEnrichmentResponse,
    RouteNormality,
    CargoTypeNormality,
)


HK_TZ = ZoneInfo("Asia/Hong_Kong")

SCORE_RANGES = {
    "strong": {
        "trade": (82, 96),
        "supplier": (75, 92),
        "order": (72, 90),
        "channel": (65, 85),
    },
    "medium": {
        "trade": (65, 81),
        "supplier": (58, 78),
        "order": (55, 75),
        "channel": (45, 70),
    },
    "weak": {
        "trade": (45, 64),
        "supplier": (35, 57),
        "order": (30, 54),
        "channel": (20, 44),
    },
    "hard_stop": {
        "trade": (0, 20),
        "supplier": (0, 20),
        "order": (0, 20),
        "channel": (0, 20),
    },
}


def build_transaction_risk_response(
    payload: TransactionRiskEnrichmentRequest,
) -> TransactionRiskEnrichmentResponse:
    scenario = determine_scenario(payload.declared_transaction.invoice.invoice_number)
    seed_text = _seed_text(payload)
    rng = random.Random(int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest(), 16))

    response = TransactionRiskEnrichmentResponse(
        cdi_request_id=f"cdi_req_{hashlib.sha256(seed_text.encode('utf-8')).hexdigest()[:10]}",
        request_id=payload.request_id,
        response_generated_at=datetime.now(HK_TZ),
        borrower_match=_build_borrower_match(payload, rng, scenario),
        risk_signals=RiskSignals(
            trade_shipment_verification=_build_trade_shipment_verification(payload, rng, scenario),
            supplier_reliability=_build_supplier_reliability(payload, rng, scenario),
            order_normality=_build_order_normality(payload, rng, scenario),
            buyer_channel_concentration=_build_channel_concentration(payload, rng, scenario),
        ),
        hard_stop_flags=_build_hard_stop_flags(scenario),
        data_limitations=[
            "Buyer-level customer concentration not available; channel-level concentration used instead.",
            "This is a deterministic mock response for demo use and is not connected to real CDI records.",
        ],
    )
    return response


def determine_scenario(invoice_number: str) -> str:
    for character in reversed(invoice_number):
        if character.isdigit():
            digit = int(character)
            if digit in (0, 1, 2, 3):
                return "strong"
            if digit in (4, 5, 6):
                return "medium"
            if digit in (7, 8):
                return "weak"
            return "hard_stop"
    return "medium"


def _seed_text(payload: TransactionRiskEnrichmentRequest) -> str:
    transaction = payload.declared_transaction
    return "|".join(
        [
            payload.request_id,
            transaction.invoice.invoice_number,
            transaction.supplier.supplier_name,
            str(payload.loan_request.loan_amount_hkd),
        ]
    )


def _score(rng: random.Random, scenario: str, key: str) -> int:
    low, high = SCORE_RANGES[scenario][key]
    return rng.randint(low, high)


def _build_borrower_match(
    payload: TransactionRiskEnrichmentRequest,
    rng: random.Random,
    scenario: str,
) -> BorrowerMatch:
    confidence_ranges = {
        "strong": (0.94, 0.99),
        "medium": (0.86, 0.95),
        "weak": (0.72, 0.88),
        "hard_stop": (0.78, 0.92),
    }
    low, high = confidence_ranges[scenario]
    return BorrowerMatch(
        matched=True,
        match_confidence=round(rng.uniform(low, high), 2),
        matched_business_registration_number=payload.borrower.hong_kong_business_registration_number,
        matched_company_name=payload.borrower.legal_name,
    )


def _build_trade_shipment_verification(
    payload: TransactionRiskEnrichmentRequest,
    rng: random.Random,
    scenario: str,
) -> TradeShipmentVerificationRisk:
    invoice_value = payload.declared_transaction.invoice.invoice_value_hkd
    variance_percent = _amount_variance_percent(rng, scenario)
    direction = -1 if rng.random() < 0.5 else 1
    matched_value = max(1, round(invoice_value * (1 + direction * variance_percent / 100)))
    actual_variance = round(abs(matched_value - invoice_value) / invoice_value * 100, 2)
    timeline = _shipment_timeline(payload.declared_transaction.shipment.expected_departure_date, payload.declared_transaction.shipment.expected_arrival_date, rng, scenario)

    if scenario == "strong":
        status = "verified"
        shipment_status = rng.choice(["booked", "in_transit", "arrived", "delivered"])
        invoice_match = True
        purchase_order_match = True
        customs_match = True
        bill_of_lading_match = True
        evidence = [
            "Invoice, PO, bill of lading, and customs declaration matched.",
            "Declared value is within tolerance of observed trade value.",
            "Shipment activity is consistent with the declared route and timeline.",
        ]
        reason_codes = [
            "TRADE_DOCS_MATCHED",
            "SHIPMENT_ACTIVE",
            "VALUE_WITHIN_TOLERANCE",
        ]
    elif scenario == "medium":
        status = "verified_with_observations"
        shipment_status = rng.choice(["booked", "in_transit", "arrived", "delayed"])
        invoice_match = True
        purchase_order_match = True
        customs_match = rng.random() >= 0.15
        bill_of_lading_match = True
        evidence = [
            "Trade records were found and key documents mostly matched.",
            "Observed trade value has a moderate variance from the declared invoice value.",
            "Shipment records support the declared movement, with minor review items.",
        ]
        reason_codes = [
            "TRADE_DOCS_MOSTLY_MATCHED",
            "MODERATE_VALUE_VARIANCE",
            "CUSTOMS_DECLARATION_OBSERVED",
        ]
        if not customs_match:
            reason_codes.append("CUSTOMS_DECLARATION_REVIEW_REQUIRED")
    elif scenario == "weak":
        status = "review_required"
        shipment_status = rng.choice(["booked", "delayed", "record_review"])
        invoice_match = True
        purchase_order_match = rng.random() >= 0.25
        customs_match = rng.random() >= 0.45
        bill_of_lading_match = rng.random() >= 0.30
        evidence = [
            "A trade record exists, but supporting records show elevated review indicators.",
            "Declared value differs materially from observed trade value.",
            "Shipment route or document status is less consistent than usual for the borrower.",
        ]
        reason_codes = [
            "TRADE_RECORD_FOUND",
            "VALUE_VARIANCE_ELEVATED",
            "SHIPMENT_REVIEW_REQUIRED",
        ]
        if not customs_match:
            reason_codes.append("CUSTOMS_DECLARATION_PENDING_REVIEW")
    else:
        status = "blocked"
        shipment_status = "record_conflict"
        invoice_match = False
        purchase_order_match = rng.random() >= 0.50
        customs_match = False
        bill_of_lading_match = False
        evidence = [
            "Invoice appears to duplicate a previously observed trade record.",
            "Customs declaration details conflict with the declared transaction.",
            "Shipment records are inconsistent with the financing request.",
        ]
        reason_codes = [
            "DUPLICATE_INVOICE",
            "CUSTOMS_DECLARATION_MISMATCH",
            "SHIPMENT_RECORD_CONFLICT",
        ]

    return TradeShipmentVerificationRisk(
        score_0_100=_score(rng, scenario, "trade"),
        status=status,
        shipment_status=shipment_status,
        invoice_match=invoice_match,
        purchase_order_match=purchase_order_match,
        customs_declaration_match=customs_match,
        bill_of_lading_match=bill_of_lading_match,
        amount_consistency=AmountConsistency(
            declared_invoice_value_hkd=invoice_value,
            matched_trade_value_hkd=matched_value,
            variance_percent=actual_variance,
            within_tolerance=actual_variance <= (2.5 if scenario == "strong" else 5.0),
        ),
        shipment_timeline=timeline,
        evidence_summary=evidence,
        reason_codes=reason_codes,
    )


def _amount_variance_percent(rng: random.Random, scenario: str) -> float:
    ranges = {
        "strong": (0.1, 2.5),
        "medium": (2.5, 6.0),
        "weak": (6.0, 18.0),
        "hard_stop": (15.0, 35.0),
    }
    low, high = ranges[scenario]
    return round(rng.uniform(low, high), 2)


def _shipment_timeline(
    expected_departure: date,
    expected_arrival: date,
    rng: random.Random,
    scenario: str,
) -> ShipmentTimeline:
    booking_date = expected_departure - timedelta(days=rng.randint(2, 7))
    if scenario == "strong":
        departure_shift = rng.choice([-1, 0, 0, 1])
        arrival_shift = rng.choice([-1, 0, 0, 1])
    elif scenario == "medium":
        departure_shift = rng.randint(0, 3)
        arrival_shift = rng.randint(1, 5)
    elif scenario == "weak":
        departure_shift = rng.randint(2, 8)
        arrival_shift = rng.randint(5, 14)
    else:
        departure_shift = rng.randint(7, 16)
        arrival_shift = rng.randint(10, 25)
    return ShipmentTimeline(
        cargo_booking_date=booking_date,
        actual_departure_date=expected_departure + timedelta(days=departure_shift),
        estimated_arrival_date=expected_arrival + timedelta(days=arrival_shift),
    )


def _build_supplier_reliability(
    payload: TransactionRiskEnrichmentRequest,
    rng: random.Random,
    scenario: str,
) -> SupplierReliabilityRisk:
    supplier = payload.declared_transaction.supplier

    if scenario == "strong":
        completed_shipments = rng.randint(24, 80)
        on_time_rate = round(rng.uniform(0.78, 0.96), 2)
        average_delay = round(rng.uniform(0.5, 3.0), 1)
        dispute_rate = round(rng.uniform(0.00, 0.06), 2)
        cancellation_rate = round(rng.uniform(0.00, 0.04), 2)
        relationship = PriorRelationshipWithBorrower(
            observed=True,
            completed_shipments_between_parties=rng.randint(3, 15),
            average_delay_days_between_parties=round(rng.uniform(0.4, 2.5), 1),
        )
        evidence = [
            "Supplier has repeated observed shipments.",
            "Delivery history is generally reliable.",
            "Dispute and cancellation rates are low.",
        ]
        reason_codes = [
            "SUPPLIER_HISTORY_FOUND",
            "GOOD_ON_TIME_RATE",
            "LOW_DISPUTE_RATE",
        ]
    elif scenario == "medium":
        completed_shipments = rng.randint(6, 30)
        on_time_rate = round(rng.uniform(0.58, 0.82), 2)
        average_delay = round(rng.uniform(3.0, 7.0), 1)
        dispute_rate = round(rng.uniform(0.04, 0.12), 2)
        cancellation_rate = round(rng.uniform(0.03, 0.10), 2)
        observed_relationship = rng.random() >= 0.35
        relationship = PriorRelationshipWithBorrower(
            observed=observed_relationship,
            completed_shipments_between_parties=rng.randint(1, 5) if observed_relationship else 0,
            average_delay_days_between_parties=round(rng.uniform(2.0, 6.5), 1) if observed_relationship else 0.0,
        )
        evidence = [
            "Supplier has usable shipment history, but relationship depth is moderate.",
            "Delivery performance is acceptable with some delay history.",
            "Dispute rate is present but not severe.",
        ]
        reason_codes = [
            "SUPPLIER_HISTORY_FOUND",
            "NEWER_SUPPLIER_RELATIONSHIP",
            "MODERATE_DELAY_HISTORY",
        ]
    elif scenario == "weak":
        completed_shipments = rng.randint(0, 8)
        on_time_rate = round(rng.uniform(0.30, 0.57), 2)
        average_delay = round(rng.uniform(7.0, 18.0), 1)
        dispute_rate = round(rng.uniform(0.12, 0.25), 2)
        cancellation_rate = round(rng.uniform(0.10, 0.22), 2)
        observed_relationship = rng.random() >= 0.75
        relationship = PriorRelationshipWithBorrower(
            observed=observed_relationship,
            completed_shipments_between_parties=rng.randint(1, 2) if observed_relationship else 0,
            average_delay_days_between_parties=round(rng.uniform(5.0, 14.0), 1) if observed_relationship else 0.0,
        )
        evidence = [
            "Supplier history is limited or inconsistent.",
            "Observed delay rates are higher than typical.",
            "Dispute and cancellation indicators are elevated.",
        ]
        reason_codes = [
            "LIMITED_SUPPLIER_HISTORY",
            "HIGHER_DELAY_RATE",
            "ELEVATED_DISPUTE_RATE",
        ]
    else:
        completed_shipments = rng.randint(0, 5)
        on_time_rate = round(rng.uniform(0.15, 0.40), 2)
        average_delay = round(rng.uniform(12.0, 30.0), 1)
        dispute_rate = round(rng.uniform(0.20, 0.40), 2)
        cancellation_rate = round(rng.uniform(0.15, 0.35), 2)
        relationship = PriorRelationshipWithBorrower(
            observed=False,
            completed_shipments_between_parties=0,
            average_delay_days_between_parties=0.0,
        )
        evidence = [
            "Supplier record requires manual review because the invoice is blocked.",
            "Observed supplier performance is weak in mock historical records.",
            "Dispute and cancellation indicators are high.",
        ]
        reason_codes = [
            "DUPLICATE_INVOICE",
            "ELEVATED_DISPUTE_RATE",
            "SUPPLIER_RECORD_REVIEW_REQUIRED",
        ]

    return SupplierReliabilityRisk(
        score_0_100=_score(rng, scenario, "supplier"),
        supplier_match=SupplierMatch(
            matched=True,
            supplier_name=supplier.supplier_name,
            supplier_country=supplier.supplier_country,
        ),
        history_window_months=24,
        completed_shipments=completed_shipments,
        on_time_delivery_rate=on_time_rate,
        average_delay_days=average_delay,
        dispute_rate=dispute_rate,
        cancellation_rate=cancellation_rate,
        prior_relationship_with_borrower=relationship,
        evidence_summary=evidence,
        reason_codes=reason_codes,
    )


def _build_order_normality(
    payload: TransactionRiskEnrichmentRequest,
    rng: random.Random,
    scenario: str,
) -> OrderNormalityRisk:
    declared_value = payload.declared_transaction.goods.declared_goods_value_hkd
    loan_duration = payload.loan_request.loan_duration_days

    if scenario == "strong":
        supplier_seen = True
        route_seen = True
        product_seen = True
        supplier_percentile = rng.randint(65, 95)
        route_percentile = rng.randint(65, 95)
        product_percentile = rng.randint(60, 90)
        value_ratio = round(rng.uniform(0.85, 1.45), 2)
        size_z_score = round(rng.uniform(0.1, 1.4), 1)
        duration_ratio = round(rng.uniform(0.85, 1.20), 2)
        evidence = [
            "Supplier, route, and product type are consistent with prior activity.",
            "Shipment value is within the borrower's observed range.",
            "Requested tenor aligns with historical cash-cycle timing.",
        ]
        reason_codes = [
            "KNOWN_SUPPLIER",
            "KNOWN_ROUTE",
            "KNOWN_PRODUCT_TYPE",
            "ORDER_SIZE_WITHIN_HISTORY",
        ]
    elif scenario == "medium":
        supplier_seen = rng.random() >= 0.30
        route_seen = True
        product_seen = rng.random() >= 0.15
        supplier_percentile = rng.randint(38, 72)
        route_percentile = rng.randint(45, 82)
        product_percentile = rng.randint(40, 75)
        value_ratio = round(rng.uniform(1.20, 2.10), 2)
        size_z_score = round(rng.uniform(1.1, 2.0), 1)
        duration_ratio = round(rng.uniform(1.10, 1.60), 2)
        evidence = [
            "Trade pattern is mostly familiar, with some newer relationship or product indicators.",
            "Shipment value is larger than usual but not extreme.",
            "Requested tenor is somewhat longer than the observed cash cycle.",
        ]
        reason_codes = [
            "KNOWN_ROUTE",
            "MODERATELY_LARGE_ORDER",
            "TENOR_SLIGHTLY_ABOVE_CYCLE",
        ]
        if not supplier_seen:
            reason_codes.append("NEWER_SUPPLIER_RELATIONSHIP")
    elif scenario == "weak":
        supplier_seen = rng.random() >= 0.70
        route_seen = rng.random() >= 0.60
        product_seen = rng.random() >= 0.45
        supplier_percentile = rng.randint(5, 45)
        route_percentile = rng.randint(5, 45)
        product_percentile = rng.randint(10, 50)
        value_ratio = round(rng.uniform(2.20, 4.50), 2)
        size_z_score = round(rng.uniform(2.1, 4.0), 1)
        duration_ratio = round(rng.uniform(1.60, 2.50), 2)
        evidence = [
            "Order size is unusually large compared with borrower history.",
            "Supplier, route, or product type is new or infrequently observed.",
            "Requested tenor is materially above the observed cash cycle.",
        ]
        reason_codes = [
            "UNUSUALLY_LARGE_ORDER",
            "NEW_SUPPLIER_OR_ROUTE",
            "TENOR_ABOVE_CASH_CYCLE",
        ]
    else:
        supplier_seen = False
        route_seen = False
        product_seen = rng.random() >= 0.60
        supplier_percentile = rng.randint(0, 15)
        route_percentile = rng.randint(0, 15)
        product_percentile = rng.randint(0, 25)
        value_ratio = round(rng.uniform(3.50, 8.00), 2)
        size_z_score = round(rng.uniform(4.0, 8.0), 1)
        duration_ratio = round(rng.uniform(2.50, 4.00), 2)
        evidence = [
            "Order pattern is blocked because the invoice appears duplicated.",
            "Supplier and route are not normal for the borrower in mock records.",
            "Order size and tenor are outside typical historical patterns.",
        ]
        reason_codes = [
            "DUPLICATE_INVOICE",
            "ORDER_PATTERN_EXCEPTION",
            "TENOR_MATERIAL_ABOVE_CYCLE",
        ]

    borrower_median_value = max(1, round(declared_value / value_ratio))
    observed_cash_cycle = max(1, round(loan_duration / duration_ratio))
    actual_duration_ratio = round(loan_duration / observed_cash_cycle, 2)

    return OrderNormalityRisk(
        score_0_100=_score(rng, scenario, "order"),
        basis="borrower_historical_trade_patterns",
        history_window_months=18,
        supplier_normality=SupplierNormality(
            same_supplier_seen_before=supplier_seen,
            supplier_frequency_percentile=supplier_percentile,
        ),
        route_normality=RouteNormality(
            route_seen_before=route_seen,
            route_frequency_percentile=route_percentile,
        ),
        cargo_type_normality=CargoTypeNormality(
            product_type_seen_before=product_seen,
            product_type_frequency_percentile=product_percentile,
        ),
        shipment_size_normality=ShipmentSizeNormality(
            current_declared_value_hkd=declared_value,
            borrower_median_shipment_value_hkd=borrower_median_value,
            value_vs_median_ratio=round(declared_value / borrower_median_value, 2),
            size_z_score=size_z_score,
        ),
        tenor_normality=TenorNormality(
            requested_loan_duration_days=loan_duration,
            observed_average_cash_cycle_days=observed_cash_cycle,
            duration_vs_observed_cycle=actual_duration_ratio,
        ),
        evidence_summary=evidence,
        reason_codes=reason_codes,
    )


def _build_channel_concentration(
    payload: TransactionRiskEnrichmentRequest,
    rng: random.Random,
    scenario: str,
) -> BuyerChannelConcentrationRisk:
    primary_channel = (
        payload.declared_transaction.sales_context.primary_marketplace
        or payload.declared_transaction.sales_context.expected_sales_channel
    )

    if scenario == "strong":
        shares = _three_channel_shares(rng, (0.32, 0.48), (0.24, 0.35))
        concentration_level = "low_moderate"
        evidence = [
            "Borrower revenue is spread across several observed sales channels.",
            "No single channel dominates the sales-channel summary.",
        ]
        reason_codes = [
            "DIVERSIFIED_CHANNEL_MIX",
            "NO_SINGLE_CHANNEL_DOMINANCE",
        ]
    elif scenario == "medium":
        shares = _three_channel_shares(rng, (0.50, 0.68), (0.17, 0.30))
        concentration_level = "moderate_high" if shares[0] >= 0.60 else "moderate"
        evidence = [
            "Borrower depends materially on one sales channel.",
            "Additional direct or physical channels reduce but do not remove concentration risk.",
        ]
        reason_codes = [
            "MODERATE_CHANNEL_CONCENTRATION",
            "MULTIPLE_CHANNELS_PRESENT",
        ]
        if shares[0] >= 0.60:
            reason_codes.insert(0, "LARGEST_CHANNEL_ABOVE_60_PERCENT")
    elif scenario == "weak":
        shares = _three_channel_shares(rng, (0.75, 0.92), (0.05, 0.16))
        concentration_level = "high"
        evidence = [
            "Sales-channel summary shows high marketplace or channel concentration.",
            "Alternative channels are present but small.",
        ]
        reason_codes = [
            "HIGH_CHANNEL_CONCENTRATION",
            "LARGEST_CHANNEL_ABOVE_75_PERCENT",
        ]
    else:
        shares = _three_channel_shares(rng, (0.90, 0.98), (0.01, 0.06))
        concentration_level = "severe"
        evidence = [
            "Sales-channel summary is highly concentrated while the transaction is blocked.",
            "Buyer-level details are unavailable in the mock enrichment record.",
        ]
        reason_codes = [
            "DUPLICATE_INVOICE",
            "SEVERE_CHANNEL_CONCENTRATION",
            "BUYER_CHANNEL_DATA_LIMITED",
        ]

    channels = _channel_names(primary_channel)
    distribution = [
        ChannelDistribution(channel=channel, revenue_share=share)
        for channel, share in zip(channels, shares, strict=True)
    ]
    hhi = round(sum(share * share for share in shares), 2)

    return BuyerChannelConcentrationRisk(
        score_0_100=_score(rng, scenario, "channel"),
        basis="sales_channel_summary",
        history_window_months=12,
        channel_distribution=distribution,
        largest_channel_share=shares[0],
        top_three_channel_share=round(sum(shares[:3]), 2),
        channel_hhi=hhi,
        concentration_level=concentration_level,
        evidence_summary=evidence,
        reason_codes=reason_codes,
    )


def _three_channel_shares(
    rng: random.Random,
    largest_range: tuple[float, float],
    second_range: tuple[float, float],
) -> list[float]:
    largest = round(rng.uniform(*largest_range), 2)
    max_second = min(second_range[1], 0.98 - largest)
    min_second = min(second_range[0], max_second)
    second = round(rng.uniform(min_second, max_second), 2)
    third = round(1.0 - largest - second, 2)
    if third <= 0:
        third = 0.01
        second = round(1.0 - largest - third, 2)
    return [largest, second, round(1.0 - largest - second, 2)]


def _channel_names(primary_channel: str) -> list[str]:
    candidates = [primary_channel, "own_website", "physical_store", "other_marketplaces"]
    unique_channels: list[str] = []
    seen = set()
    for channel in candidates:
        normalized = channel.strip() or "primary_channel"
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        unique_channels.append(normalized)
        if len(unique_channels) == 3:
            break
    return unique_channels


def _build_hard_stop_flags(scenario: str) -> list[HardStopFlag]:
    if scenario != "hard_stop":
        return []
    return [
        HardStopFlag(
            code="DUPLICATE_INVOICE",
            severity="block",
            message="Invoice appears to have been previously financed or duplicated in trade records.",
        ),
        HardStopFlag(
            code="SHIPMENT_RECORD_CONFLICT",
            severity="block",
            message="Shipment record conflicts with the declared invoice and bill of lading details.",
        ),
    ]
