# Mock CDI Trade Risk Enrichment API

Small FastAPI mock service for a Hong Kong supply-chain lending hackathon demo.

The API acts as a realistic stand-in for a CDI-style trade-data enrichment service. It returns transaction risk signals that a lending platform can use as inputs to its own credit scoring model. The lending platform remains responsible for calculating the final credit score and financing decision.

This is not a real CDI implementation, is not connected to any live Hong Kong CDI, bank, customs, cargo, marketplace, or company-registry data source, and must only be used as a demo mock.

## Project Structure

```text
mock-cdi-api/
  app/
    __init__.py
    main.py
    models.py
    mock_logic.py
  README.md
  requirements.txt
```

## Setup

```bash
cd mock-cdi-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

OpenAPI docs:

```text
http://127.0.0.1:8000/docs
```

## Endpoints

### `GET /health`

Health check endpoint.

Example response:

```json
{
  "status": "ok",
  "service": "mock-cdi-api"
}
```

### `POST /mock-cdi/v1/transaction-risk-enrichment`

Returns CDI-style risk enrichment data for a declared loan transaction.

The response contains four scoring datapoints:

```text
Verified trade/shipment data                  -> risk_signals.trade_shipment_verification.score_0_100
Supplier reliability                          -> risk_signals.supplier_reliability.score_0_100
CDI-based order normality                     -> risk_signals.order_normality.score_0_100
Buyer/customer/channel concentration risk     -> risk_signals.buyer_channel_concentration.score_0_100
```

## Example Curl Request

```bash
curl -s -X POST http://127.0.0.1:8000/mock-cdi/v1/transaction-risk-enrichment \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "loanreq_2026_000123",
    "consent": {
      "consent_id": "consent_abc123",
      "scopes": [
        "trade_records",
        "cargo_records",
        "customs_declarations",
        "supplier_history",
        "sales_channel_summary"
      ]
    },
    "borrower": {
      "platform_borrower_id": "brw_001",
      "legal_name": "Harbour Retail Limited",
      "hong_kong_business_registration_number": "12345678",
      "company_registry_number": "CR-998877",
      "registered_address": "Unit 1204, Kowloon Commerce Centre, Hong Kong"
    },
    "loan_request": {
      "loan_amount_hkd": 420000,
      "loan_duration_days": 60,
      "loan_purpose": "Purchase inventory for resale",
      "expected_repayment_source": "inventory_sales"
    },
    "declared_transaction": {
      "purchase_order": {
        "po_number": "PO-2026-0441",
        "po_date": "2026-06-01",
        "po_value_hkd": 600000
      },
      "invoice": {
        "invoice_number": "INV-DEMO-1002",
        "invoice_date": "2026-06-02",
        "invoice_value_hkd": 600000,
        "invoice_file_hash": "sha256:7f4a..."
      },
      "supplier": {
        "supplier_name": "Shenzhen Pearl Electronics Co Ltd",
        "supplier_country": "CN",
        "supplier_registration_id": "CN-91440300XXXX"
      },
      "goods": {
        "product_type": "consumer_electronics_accessories",
        "description": "Wireless chargers and phone accessories",
        "quantity": 12000,
        "declared_goods_value_hkd": 600000
      },
      "shipment": {
        "transport_mode": "sea",
        "origin_port": "Yantian",
        "destination_port": "Hong Kong",
        "expected_departure_date": "2026-06-08",
        "expected_arrival_date": "2026-06-12",
        "bill_of_lading_number": "BL-YTN-HKG-99218",
        "container_numbers": ["TEMU1234567"]
      },
      "sales_context": {
        "expected_sales_channel": "marketplace",
        "primary_marketplace": "HKTVmall",
        "expected_sell_through_days": 45
      }
    }
  }'
```

## Example Response

Exact numeric values are deterministic for the same request seed, but will vary across different request IDs, invoices, suppliers, and loan amounts.

```json
{
  "cdi_request_id": "cdi_req_4c9f0a1b2d",
  "request_id": "loanreq_2026_000123",
  "response_generated_at": "2026-06-07T14:21:00+08:00",
  "borrower_match": {
    "matched": true,
    "match_confidence": 0.97,
    "matched_business_registration_number": "12345678",
    "matched_company_name": "Harbour Retail Limited"
  },
  "risk_signals": {
    "trade_shipment_verification": {
      "score_0_100": 88,
      "status": "verified",
      "shipment_status": "in_transit",
      "invoice_match": true,
      "purchase_order_match": true,
      "customs_declaration_match": true,
      "bill_of_lading_match": true,
      "amount_consistency": {
        "declared_invoice_value_hkd": 600000,
        "matched_trade_value_hkd": 598700,
        "variance_percent": 0.22,
        "within_tolerance": true
      },
      "shipment_timeline": {
        "cargo_booking_date": "2026-06-05",
        "actual_departure_date": "2026-06-08",
        "estimated_arrival_date": "2026-06-12"
      },
      "evidence_summary": [
        "Invoice, PO, bill of lading, and customs declaration matched.",
        "Declared value is within tolerance of observed trade value.",
        "Shipment activity is consistent with the declared route and timeline."
      ],
      "reason_codes": [
        "TRADE_DOCS_MATCHED",
        "SHIPMENT_ACTIVE",
        "VALUE_WITHIN_TOLERANCE"
      ]
    },
    "supplier_reliability": {
      "score_0_100": 79,
      "supplier_match": {
        "matched": true,
        "supplier_name": "Shenzhen Pearl Electronics Co Ltd",
        "supplier_country": "CN"
      },
      "history_window_months": 24,
      "completed_shipments": 38,
      "on_time_delivery_rate": 0.84,
      "average_delay_days": 2.6,
      "dispute_rate": 0.05,
      "cancellation_rate": 0.03,
      "prior_relationship_with_borrower": {
        "observed": true,
        "completed_shipments_between_parties": 7,
        "average_delay_days_between_parties": 1.9
      },
      "evidence_summary": [
        "Supplier has repeated observed shipments.",
        "Delivery history is generally reliable.",
        "Dispute and cancellation rates are low."
      ],
      "reason_codes": [
        "SUPPLIER_HISTORY_FOUND",
        "GOOD_ON_TIME_RATE",
        "LOW_DISPUTE_RATE"
      ]
    },
    "order_normality": {
      "score_0_100": 75,
      "basis": "borrower_historical_trade_patterns",
      "history_window_months": 18,
      "supplier_normality": {
        "same_supplier_seen_before": true,
        "supplier_frequency_percentile": 72
      },
      "route_normality": {
        "route_seen_before": true,
        "route_frequency_percentile": 81
      },
      "cargo_type_normality": {
        "product_type_seen_before": true,
        "product_type_frequency_percentile": 66
      },
      "shipment_size_normality": {
        "current_declared_value_hkd": 600000,
        "borrower_median_shipment_value_hkd": 430000,
        "value_vs_median_ratio": 1.4,
        "size_z_score": 1.2
      },
      "tenor_normality": {
        "requested_loan_duration_days": 60,
        "observed_average_cash_cycle_days": 48,
        "duration_vs_observed_cycle": 1.25
      },
      "evidence_summary": [
        "Supplier, route, and product type are consistent with prior activity.",
        "Shipment value is within the borrower's observed range.",
        "Requested tenor aligns with historical cash-cycle timing."
      ],
      "reason_codes": [
        "KNOWN_SUPPLIER",
        "KNOWN_ROUTE",
        "KNOWN_PRODUCT_TYPE",
        "ORDER_SIZE_WITHIN_HISTORY"
      ]
    },
    "buyer_channel_concentration": {
      "score_0_100": 71,
      "basis": "sales_channel_summary",
      "history_window_months": 12,
      "channel_distribution": [
        {
          "channel": "HKTVmall",
          "revenue_share": 0.42
        },
        {
          "channel": "own_website",
          "revenue_share": 0.31
        },
        {
          "channel": "physical_store",
          "revenue_share": 0.27
        }
      ],
      "largest_channel_share": 0.42,
      "top_three_channel_share": 1.0,
      "channel_hhi": 0.35,
      "concentration_level": "low_moderate",
      "evidence_summary": [
        "Borrower revenue is spread across several observed sales channels.",
        "No single channel dominates the sales-channel summary."
      ],
      "reason_codes": [
        "DIVERSIFIED_CHANNEL_MIX",
        "NO_SINGLE_CHANNEL_DOMINANCE"
      ]
    }
  },
  "hard_stop_flags": [],
  "data_limitations": [
    "Buyer-level customer concentration not available; channel-level concentration used instead.",
    "This is a deterministic mock response for demo use and is not connected to real CDI records."
  ]
}
```

## Semi-Deterministic Mock Logic

The API always returns an enrichment response for valid request JSON. It does not implement ordinary "not found" cases. The only blocking outcome is the hard-stop scenario, which still returns HTTP 200 with `hard_stop_flags`.

Scenario selection is based on the last digit found in:

```text
declared_transaction.invoice.invoice_number
```

If the invoice number contains no digit, the API uses `medium`.

```text
0, 1, 2, 3 -> strong
4, 5, 6    -> medium
7, 8       -> weak
9          -> hard_stop
```

Sample invoice numbers:

```text
INV-DEMO-1002 -> strong
INV-DEMO-1005 -> medium
INV-DEMO-1008 -> weak
INV-DEMO-1009 -> hard stop
```

Within each scenario, the API uses a seeded random generator so values are stable for the same input while still looking realistic. The seed is composed from:

```text
request_id
invoice_number
supplier_name
loan_amount_hkd
```

The scenario controls score ranges, document-match behavior, variance ranges, supplier-history metrics, order-normality metrics, channel concentration, evidence summaries, and reason codes.

## Scenario Score Ranges

```text
strong:
  trade_shipment_verification:     82-96
  supplier_reliability:            75-92
  order_normality:                 72-90
  buyer_channel_concentration:     65-85

medium:
  trade_shipment_verification:     65-81
  supplier_reliability:            58-78
  order_normality:                 55-75
  buyer_channel_concentration:     45-70

weak:
  trade_shipment_verification:     45-64
  supplier_reliability:            35-57
  order_normality:                 30-54
  buyer_channel_concentration:     20-44

hard_stop:
  all scores:                       0-20
```

Hard-stop example flag:

```json
{
  "code": "DUPLICATE_INVOICE",
  "severity": "block",
  "message": "Invoice appears to have been previously financed or duplicated in trade records."
}
```

Hard-stop requests are not rejected with HTTP 400. They return HTTP 200 with blocking flags in the JSON body.

## Validation Notes

The API uses Pydantic models for request and response schemas.

Basic validation includes:

```text
amount fields must be positive
loan duration must be positive
consent scopes must be strings
required IDs and names must be non-empty strings
```

Invalid request shapes return FastAPI's standard HTTP 422 validation response.
