# Loan Scoring Demo Documentation

## What This Is

The loan-scoring demo subsystem calculates a hackathon/demo credit score for Hong Kong SME supply-chain loan requests. Scoring is now backend-owned.

Authoritative backend scoring code lives in:

```text
backend/src/services/loan_scoring/
```

The backend equivalents of the original two-function flow are:

```text
backend/src/services/loan_scoring/invent.py
backend/src/services/loan_scoring/service.py
```

Function names:

```python
invent_loan_scoring_input(input_data)
score_loan_request(expanded_input)
```

The older frontend TypeScript scoring files under `frontend/src/loan-scoring-demo/` are retained only as isolated demo/reference code. They are not called by the loan creation or deal detail pages.

## Runtime Flow

The application flow is:

```text
frontend creation form
  -> POST /api/v1/loans
  -> backend builds LoanApplicationInput
  -> invent_loan_scoring_input(input)
  -> score_loan_request(expanded_input)
  -> backend calls MOCK-CDI-API
  -> backend stores credit_score JSON on the loan
  -> frontend fetches and displays the stored score
```

Scoring happens once when a loan/deal is created. The frontend does not recalculate scores, does not call `scoreLoanRequest`, and does not call the mock CDI API.

## Documentation JSON Files

```text
.documentation/loan-scoring-input-examples.json
.documentation/loan-scoring-output-examples.json
```

`loan-scoring-input-examples.json` contains five frontend/demo input objects compatible with `LoanApplicationInput`.

`loan-scoring-output-examples.json` contains example scoring outputs from running those inputs through the scoring flow. These files are hackathon/demo documentation aids, not production fixtures.

## Database Persistence

The loan table stores the full score result as JSON:

```text
loans.credit_score
loans.loan_scoring_input
```

The migration is:

```text
backend/alembic/versions/e7f8a9b0c1d2_loan_scoring_demo_payloads.py
```

The persisted `credit_score` shape is:

```ts
{
  total_score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  borrower_score: number;
  transaction_score: number;
  showstopper: string | null;
  borrower_components: ScoreComponent[];
  transaction_components: ScoreComponent[];
}
```

The existing `risk_score` and `risk_grade` columns are kept in sync for marketplace cards and filters.

## Backend API Integration

Loan creation endpoint:

```text
POST /api/v1/loans
```

Backend files:

```text
backend/src/api/v1/schemas/loan.py
backend/src/services/loan_service.py
backend/src/api/v1/endpoints/loans.py
```

The create schema accepts normal deal fields plus scoring input fields:

```text
borrower_id
loan_amount_hkd
loan_duration_days
purchase_order_value_hkd
invoice_value_hkd
supplier_name
supplier_country
product_type
goods_description
quantity
expected_delivery_days
expected_repayment_source
collateral.type
collateral.value_hkd
sales_context.expected_sales_channel
sales_context.primary_marketplace
demo_scenario
```

If older callers omit scoring fields, the backend fills deterministic demo defaults from the deal data before scoring.

## Frontend Integration

Informational scoring/CDI tab:

```text
frontend/src/pages/CDI.tsx
```

The existing "Scoring & CDI" UI tab now explains the backend-owned scoring model, the
borrower/transaction component weights, mock CDI enrichment, showstopper logic, and
creation-time storage/display flow. It is static informational UI and does not call the scoring
service or the mock CDI API.

Creation page:

```text
frontend/src/pages/NewDeal.tsx
```

The creation page collects scoring fields and submits them to the backend. It no longer calculates credit scores locally.

Deal detail route:

```text
/deals/:id
```

Detail page:

```text
frontend/src/pages/LoanDetail.tsx
```

The detail page reads `loan.credit_score` returned by the backend and displays:

- total score
- persisted grade
- borrower subtotal
- transaction subtotal
- all borrower components
- all transaction components
- `Manual review / blocked: <showstopper>` when present

If an old loan record lacks `credit_score`, the page falls back to the legacy headline score without recalculating or calling CDI.

## Fake Document Extraction

The creation page keeps a visual document upload area and an `Extract from documents` action for demo plausibility.

The local mock extractor lives in:

```text
frontend/src/loan-scoring-demo/mockDocumentExtraction.ts
```

It only fills form fields. It does not upload files, parse files, run OCR, call an LLM, call OpenAI, calculate scores, or call CDI.

## Mock CDI API

The backend calls the mock CDI API. The frontend must not call it.

Mock CDI project:

```text
MOCK-CDI-API
```

Backend CDI client:

```text
backend/src/services/loan_scoring/cdi_client.py
```

Score mapping:

```text
Verified trade/shipment data                  -> risk_signals.trade_shipment_verification.score_0_100
Supplier reliability                          -> risk_signals.supplier_reliability.score_0_100
CDI-based order normality                     -> risk_signals.order_normality.score_0_100
Buyer/customer/channel concentration risk     -> risk_signals.buyer_channel_concentration.score_0_100
```

If the CDI call fails, the backend still creates/saves the loan and sets:

```text
showstopper = "CDI mock API unavailable."
```

## Environment Variables

Docker/internal defaults:

```env
MOCK_CDI_HOST=mock-cdi-api
MOCK_CDI_PORT=8000
MOCK_CDI_BASE_URL=http://mock-cdi-api:8000
```

For non-Docker local runs:

```env
MOCK_CDI_BASE_URL=http://localhost:8000
```

The local Compose override exposes the mock CDI API on the host with:

```env
MOCK_CDI_PUBLIC_PORT=8001
```

That avoids colliding with the backend dev server on host port `8000`.

## Docker Dev Stack

The mock CDI API is part of the Docker Compose stack as service:

```text
mock-cdi-api
```

Docker files:

```text
MOCK-CDI-API/Dockerfile
docker-compose.yml
docker-compose.override.yml
```

Start the full local stack:

```bash
docker compose up --build
```

The backend container receives:

```text
MOCK_CDI_BASE_URL=http://mock-cdi-api:8000
```

The backend depends on `mock-cdi-api` health before starting. The backend entrypoint also runs:

```bash
uv run alembic upgrade head
```

Verify mock CDI from the host in the dev stack:

```bash
curl -s http://localhost:8001/health
```

Expected response:

```json
{"status":"ok","service":"mock-cdi-api"}
```

## Manual Backend Scoring

From the repository root, with the mock CDI API running:

```bash
cd backend
MOCK_CDI_BASE_URL=http://localhost:8000 uv run python - <<'PY'
import asyncio
from src.services.loan_scoring import (
    loan_application_from_create_payload,
    score_loan_application,
)

async def main():
    payload = {
        "amount": 420000,
        "term_days": 60,
        "borrower_id": "brw_001",
        "purchase_order_value_hkd": 600000,
        "invoice_value_hkd": 600000,
        "supplier_name": "Shenzhen Pearl Electronics Co Ltd",
        "supplier_country": "CN",
        "product_type": "consumer_electronics_accessories",
        "expected_delivery_days": 5,
        "expected_repayment_source": "marketplace_sales",
        "collateral": {"type": "insured_goods", "value_hkd": 600000},
        "sales_context": {
            "expected_sales_channel": "marketplace",
            "primary_marketplace": "HKTVmall",
        },
        "demo_scenario": "strong",
    }
    application = loan_application_from_create_payload(payload)
    expanded, score = await score_loan_application(application)
    print(expanded.request_id, score.total_score, score.grade, score.showstopper)

asyncio.run(main())
PY
```

## Create And View A Stored Score

1. Start the full stack:

```bash
docker compose up --build
```

2. Open the frontend.
3. Go to `/deals/new`.
4. Fill the demo scoring fields or choose a scenario and click `Extract from documents`.
5. Submit the deal.
6. Open `/deals/:id`.

The detail page displays the `credit_score` that was calculated by the backend and stored in the database.

## Regenerate Output Examples

The `.documentation/loan-scoring-output-examples.json` file can be regenerated from the host by running the backend scoring module against `.documentation/loan-scoring-input-examples.json` while the mock CDI API is running.

With the Docker dev stack running, the mock CDI API is exposed on host port `8001` by default:

```bash
cd backend
MOCK_CDI_BASE_URL=http://localhost:8001 uv run python - <<'PY'
import asyncio
import json
from pathlib import Path
from src.services.loan_scoring import LoanApplicationInput, score_loan_application

async def main():
    input_path = Path("../.documentation/loan-scoring-input-examples.json")
    output_path = Path("../.documentation/loan-scoring-output-examples.json")
    inputs = json.loads(input_path.read_text())
    outputs = []
    for item in inputs:
        payload = {k: v for k, v in item.items() if not k.startswith("_")}
        expanded, credit_score = await score_loan_application(LoanApplicationInput(**payload))
        outputs.append({
            "_example_name": item.get("_example_name"),
            "scoring_input": expanded.model_dump(mode="json"),
            "credit_score": credit_score.model_dump(mode="json"),
        })
    output_path.write_text(json.dumps(outputs, indent=2) + "\n")

asyncio.run(main())
PY
```

If running outside Docker, set:

```bash
MOCK_CDI_BASE_URL=http://localhost:8000
```
