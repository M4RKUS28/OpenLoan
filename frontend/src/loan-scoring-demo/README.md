# Loan Scoring Demo

This is an isolated hackathon demo subsystem for scoring short-term Hong Kong SME supply-chain loan requests. It does not change existing app routes, API clients, backend services, database models, or package scripts.

## Two-Function Flow

1. Frontend/demo payload -> `inventLoanScoringInput(input)`
   - Accepts a simple `LoanApplicationInput`.
   - Completes deterministic mock trade, shipment, collateral, and CDI-consent fields.
   - Returns a full internal `LoanScoringInput`.

2. Expanded input -> `scoreLoanRequest(input)`
   - Loads hardcoded borrower score data from `mockBorrowerDb.ts`.
   - Calculates local transaction score components.
   - Calls the mock CDI API at `/mock-cdi/v1/transaction-risk-enrichment`.
   - Returns `LoanScoreResult` with total score, borrower score, transaction score, component breakdowns, and `showstopper`.

## How To Use

Import directly from the isolated folder:

```ts
import {
  inventLoanScoringInput,
  scoreLoanRequest,
  type LoanApplicationInput,
} from "@/loan-scoring-demo";

const application: LoanApplicationInput = {
  borrower_id: "brw_001",
  loan_amount_hkd: 420000,
  loan_duration_days: 60,
  purchase_order_value_hkd: 600000,
  invoice_value_hkd: 600000,
  supplier_name: "Shenzhen Pearl Electronics Co Ltd",
  supplier_country: "CN",
  product_type: "consumer_electronics_accessories",
  expected_delivery_days: 5,
  expected_repayment_source: "marketplace_sales",
  collateral: { type: "insured_goods", value_hkd: 600000 },
  sales_context: {
    expected_sales_channel: "marketplace",
    primary_marketplace: "HKTVmall",
  },
  demo_scenario: "strong",
};

const scoringInput = inventLoanScoringInput(application);
const result = await scoreLoanRequest(scoringInput);
```

No root export was added. Existing source files were left untouched.

## Mock CDI API

Start the mock service from the repository root:

```bash
cd MOCK-CDI-API
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The scoring client posts to:

```text
POST http://localhost:8000/mock-cdi/v1/transaction-risk-enrichment
```

Configure the base URL with:

```bash
MOCK_CDI_BASE_URL=http://localhost:8000
```

The client defaults to `http://localhost:8000`. In a Vite browser bundle, Vite exposes only prefixed environment variables by default, so the client also accepts `VITE_MOCK_CDI_BASE_URL` or an explicit `scoreLoanRequest(input, { cdiBaseUrl })` option for local demos.

## Schema Summary

`LoanApplicationInput` contains basic borrower, loan, supplier, goods, collateral, sales-channel, and optional `demo_scenario` fields.

`LoanScoringInput` adds deterministic internal demo data:

- `request_id`
- purchase order and invoice numbers/dates
- supplier registration ID
- shipment details
- bill of lading or air waybill fields
- container numbers
- collateral policy/receipt numbers where relevant
- CDI consent ID and all consent scopes

`LoanScoreResult` contains:

- `total_score`
- `borrower_score`
- `transaction_score`
- `showstopper`
- `borrower_components`
- `transaction_components`

Unknown borrower IDs return a default weak/thin-file borrower record instead of throwing.

## Score Weights

Borrower score, max 45 weighted points:

| Key | Weight |
| --- | ---: |
| `repayment_history` | 20 |
| `current_platform_exposure` | 10 |
| `business_age_continuity` | 5 |
| `legal_compliance` | 4 |
| `kyb_consistency` | 2 |
| `cdi_activity_continuity` | 4 |

Transaction score, max 55 weighted points:

| Key | Weight |
| --- | ---: |
| `loan_to_invoice_reasonableness` | 8 |
| `collateral_recovery_quality` | 10 |
| `platform_order_normality` | 7 |
| `basic_transaction_completeness` | 5 |
| `verified_trade_shipment` | 14 |
| `supplier_reliability` | 4 |
| `cdi_order_normality` | 4 |
| `buyer_channel_concentration` | 3 |

Each component returns `key`, `label`, `weight_percent`, `raw_score_0_100`, and `weighted_points`, where:

```text
weighted_points = raw_score_0_100 * weight_percent / 100
```

## Hard Stops

Local showstoppers:

- `Loan amount must be positive.`
- `Loan duration must be positive.`
- `Invoice value must be positive.`
- `Requested loan amount exceeds invoice value.`

If the CDI response includes `hard_stop_flags`, the first flag message becomes `showstopper`. If the CDI call is unavailable and no earlier showstopper exists, `showstopper` is set to `CDI mock API unavailable.` The function still returns all score fields it can calculate; CDI-derived components are `0` when CDI data is unavailable.

## Examples

Example applications are in:

```text
.documentation/loan-scoring-input-examples.json
```

Generated result fixtures, when available, are in:

```text
.documentation/loan-scoring-output-examples.json
```

To regenerate results manually, start the mock CDI API and run the five JSON payloads through:

```ts
const expanded = inventLoanScoringInput(application);
const result = await scoreLoanRequest(expanded);
```
