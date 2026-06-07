import httpx

from src.config.settings import settings

from .types import BorrowerScoreRecord, CdiCallResult, LoanScoringInput

TRANSACTION_RISK_ENDPOINT = "/mock-cdi/v1/transaction-risk-enrichment"


async def fetch_cdi_transaction_risk_enrichment(
    input_data: LoanScoringInput,
    borrower_record: BorrowerScoreRecord,
) -> CdiCallResult:
    base_url = _mock_cdi_base_url()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{base_url}{TRANSACTION_RISK_ENDPOINT}",
                json=_build_cdi_request(input_data, borrower_record),
            )
            response.raise_for_status()
            return CdiCallResult(response=response.json())
    except Exception:
        return CdiCallResult(unavailable=True)


def _mock_cdi_base_url() -> str:
    return settings.resolved_mock_cdi_base_url.rstrip("/")


def _build_cdi_request(
    input_data: LoanScoringInput,
    borrower_record: BorrowerScoreRecord,
) -> dict:
    transaction = input_data.transaction
    sales_context = transaction.sales_context
    shipment = transaction.shipment
    return {
        "request_id": input_data.request_id,
        "consent": input_data.cdi_consent.model_dump(mode="json"),
        "borrower": {
            "platform_borrower_id": borrower_record.borrower_id,
            "legal_name": borrower_record.borrower_profile.legal_name,
            "hong_kong_business_registration_number": (
                borrower_record.borrower_profile.hong_kong_business_registration_number
            ),
            "company_registry_number": (
                borrower_record.borrower_profile.company_registry_number
            ),
            "registered_address": (
                borrower_record.borrower_profile.registered_address or "Hong Kong"
            ),
        },
        "loan_request": {
            "loan_amount_hkd": round(input_data.loan_request.loan_amount_hkd),
            "loan_duration_days": input_data.loan_request.loan_duration_days,
            "loan_purpose": "Short-term supply-chain financing for declared trade transaction",
            "expected_repayment_source": input_data.loan_request.expected_repayment_source,
        },
        "declared_transaction": {
            "purchase_order": {
                "po_number": transaction.purchase_order.po_number,
                "po_date": transaction.purchase_order.po_date,
                "po_value_hkd": round(transaction.purchase_order.po_value_hkd),
            },
            "invoice": {
                "invoice_number": transaction.invoice.invoice_number,
                "invoice_date": transaction.invoice.invoice_date,
                "invoice_value_hkd": round(transaction.invoice.invoice_value_hkd),
            },
            "supplier": transaction.supplier.model_dump(mode="json"),
            "goods": {
                "product_type": transaction.goods.product_type,
                "description": transaction.goods.description or transaction.goods.product_type,
                "quantity": transaction.goods.quantity or 1,
                "declared_goods_value_hkd": round(
                    transaction.goods.declared_goods_value_hkd
                ),
            },
            "shipment": {
                "transport_mode": shipment.transport_mode,
                "origin_port": shipment.origin_port,
                "destination_port": shipment.destination_port,
                "expected_departure_date": shipment.expected_departure_date,
                "expected_arrival_date": shipment.expected_arrival_date,
                "bill_of_lading_number": (
                    shipment.bill_of_lading_number
                    or shipment.air_waybill_number
                    or f"BL-{input_data.request_id}"
                ),
                "container_numbers": shipment.container_numbers or [],
            },
            "sales_context": {
                "expected_sales_channel": (
                    sales_context.expected_sales_channel if sales_context else "other"
                ),
                "primary_marketplace": (
                    sales_context.primary_marketplace if sales_context else None
                ),
                "expected_sell_through_days": (
                    sales_context.expected_sell_through_days
                    if sales_context and sales_context.expected_sell_through_days
                    else max(1, input_data.loan_request.loan_duration_days)
                ),
            },
        },
    }
