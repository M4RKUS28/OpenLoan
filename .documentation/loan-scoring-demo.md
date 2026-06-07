# Loan Scoring Demo Documentation

## What This Is

The loan-scoring demo subsystem is an isolated TypeScript demo module for scoring short-term Hong Kong SME supply-chain loan requests. It lives in:

```text
frontend/src/loan-scoring-demo/
```

The two main functions are:

```text
frontend/src/loan-scoring-demo/inventLoanScoringInput.ts
frontend/src/loan-scoring-demo/scoreLoanRequest.ts
```

They are also exported from:

```text
frontend/src/loan-scoring-demo/index.ts
```

The subsystem is for hackathon/demo documentation and scoring demos only. The JSON files in `.documentation` are not production fixtures and are not used by the application at runtime.

## Documentation JSON Files

```text
.documentation/loan-scoring-input-examples.json
.documentation/loan-scoring-output-examples.json
```

`loan-scoring-input-examples.json` contains five frontend/demo input objects compatible with `LoanApplicationInput`.

`loan-scoring-output-examples.json` contains corresponding example outputs from running each input through:

1. `inventLoanScoringInput(input)`
2. `scoreLoanRequest(expandedInput)`

The full documentation flow is:

```text
loan-scoring-input-examples.json
  -> inventLoanScoringInput
  -> LoanScoringInput
  -> scoreLoanRequest
  -> loan-scoring-output-examples.json
```

The high-level function flow is:

```text
frontend/demo input
  -> inventLoanScoringInput(input)
  -> expanded internal LoanScoringInput
  -> scoreLoanRequest(expandedInput)
  -> borrower DB lookup + mock CDI API call + final score result
```

## Install Main Project Dependencies

The loan-scoring subsystem is TypeScript inside the frontend app. From the repository root:

```bash
cd frontend
npm ci
```

The frontend package scripts are:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Use `npm run build` to run the normal frontend type check and production build:

```bash
cd frontend
npm run build
```

## Install And Start The Mock CDI API

The mock CDI API is expected to live in:

```text
MOCK-CDI-API
```

Install its Python dependencies from the repository root:

```bash
cd MOCK-CDI-API
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the mock CDI API:

```bash
cd MOCK-CDI-API
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Confirm it is running:

```bash
curl -s http://localhost:8000/health
```

Expected response:

```json
{"status":"ok","service":"mock-cdi-api"}
```

The scoring subsystem calls:

```text
POST http://localhost:8000/mock-cdi/v1/transaction-risk-enrichment
```

The default mock CDI base URL is:

```text
http://localhost:8000
```

Override it with:

```bash
MOCK_CDI_BASE_URL=http://localhost:8000
```

You can also pass an explicit URL when calling `scoreLoanRequest`:

```ts
await scoreLoanRequest(expandedInput, { cdiBaseUrl: "http://localhost:8000" });
```

## Manual TypeScript Usage

For app code, import directly from the isolated frontend folder:

```ts
import { inventLoanScoringInput, scoreLoanRequest } from "@/loan-scoring-demo";

const expandedInput = inventLoanScoringInput(application);
const result = await scoreLoanRequest(expandedInput);
```

For a one-off Node command without adding dependencies, bundle the isolated TypeScript entry with the existing frontend toolchain, then run it with Node.

From the repository root:

```bash
cd frontend
./node_modules/.bin/esbuild src/loan-scoring-demo/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=/tmp/openloan-loan-scoring-demo.mjs
```

Then run a single example:

```bash
cd ..
node --input-type=module <<'EOF'
import { readFile } from "node:fs/promises";
import {
  inventLoanScoringInput,
  scoreLoanRequest,
} from "/tmp/openloan-loan-scoring-demo.mjs";

const applications = JSON.parse(
  await readFile(".documentation/loan-scoring-input-examples.json", "utf8"),
);
const expandedInput = inventLoanScoringInput(applications[0]);
const result = await scoreLoanRequest(expandedInput, {
  cdiBaseUrl: process.env.MOCK_CDI_BASE_URL ?? "http://localhost:8000",
});

console.log(JSON.stringify({ expandedInput, result }, null, 2));
EOF
```

## Regenerate Output Examples

Start the mock CDI API first, then run this from the repository root:

```bash
cd frontend
./node_modules/.bin/esbuild src/loan-scoring-demo/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=/tmp/openloan-loan-scoring-demo.mjs
cd ..
node --input-type=module <<'EOF'
import { readFile, writeFile } from "node:fs/promises";
import {
  inventLoanScoringInput,
  scoreLoanRequest,
} from "/tmp/openloan-loan-scoring-demo.mjs";

const applications = JSON.parse(
  await readFile(".documentation/loan-scoring-input-examples.json", "utf8"),
);
const outputExamples = [];
const cdiBaseUrl = process.env.MOCK_CDI_BASE_URL ?? "http://localhost:8000";

for (const application of applications) {
  const expandedInput = inventLoanScoringInput(application);
  const result = await scoreLoanRequest(expandedInput, { cdiBaseUrl });

  outputExamples.push({
    _example_name: application._example_name,
    scoring_input: expandedInput,
    result,
  });
}

await writeFile(
  ".documentation/loan-scoring-output-examples.json",
  `${JSON.stringify(outputExamples, null, 2)}\n`,
);
EOF
```

## Score And API Mapping

`scoreLoanRequest(expandedInput)` calls the mock CDI API at `MOCK_CDI_BASE_URL`, defaulting to `http://localhost:8000`.

The CDI response fields map into transaction score components as follows:

```text
Verified trade/shipment data                  -> risk_signals.trade_shipment_verification.score_0_100
Supplier reliability                          -> risk_signals.supplier_reliability.score_0_100
CDI-based order normality                     -> risk_signals.order_normality.score_0_100
Buyer/customer/channel concentration risk     -> risk_signals.buyer_channel_concentration.score_0_100
```

The local scoring function combines:

- borrower score data from `frontend/src/loan-scoring-demo/mockBorrowerDb.ts`
- local transaction score rules from `frontend/src/loan-scoring-demo/scoringRules.ts`
- CDI-derived transaction score fields from the mock CDI API
- a final `showstopper` string when local validation or CDI hard-stop flags block the request
