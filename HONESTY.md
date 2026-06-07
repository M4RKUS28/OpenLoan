# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of your repository. Judges cross-check it against your code and your technical video.
>
> **The deal:** disclosed shortcuts are **not** penalized — that is the entire point of this file. Hidden ones are. Undisclosed pre-built code is heavily penalized, each undisclosed mock carries a small penalty, and a faked demo is heavily penalized. Telling the truth here costs you nothing.

---

## 1. Team — who did what

Judges compare this against `git shortlog -sn`, so keep it honest.

| Member | GitHub handle | Main contributions |
|---|---|---|
| Markus Huber | `Markus Huber` | Full-stack implementation: backend, database, infrastructure, authentication, marketplace flow, MCP server, frontend integration |
| Jonas Bela Hörter | `Jonas Bela Hörter` | Credit-scoring system, scoring model design, mock CDI integration, scoring UI, demo payloads and documentation |
| ypxz | `ypxz` | Frontend polish, layout/header/footer/logo work, landing page and presentation-oriented UI cleanup |

---

## 2. What is fully working

Features that run end-to-end on the live app, with real data and real logic. Be specific: name the feature, what input it takes, what output it produces.

- **Loan marketplace:** users can browse loan/deal records stored in the database. The frontend fetches loans from the backend and displays deal information, status, score, and related metadata.
- **Loan detail view:** opening a loan/deal shows the stored loan information, company/trade description, credit score, grade, borrower-score components, transaction-score components, and showstopper status if present.
- **Loan creation:** submitting a loan request creates a stored loan/deal record. The backend calculates the credit score at creation time and saves the score in the database.
- **Credit-scoring engine:** the backend calculates a rules-based credit score from borrower and transaction datapoints. It produces borrower subtotal, transaction subtotal, total score, A–E grade, and individual weighted score components.
- **Backend CDI-style enrichment call:** during scoring, the backend makes a real HTTP call to a CDI-style mock API service and uses the returned trade/shipment/supplier/channel signals in the transaction score.
- **Bidding / auction flow:** lenders can place bids on open loan/deal records, and bid data is persisted and displayed.
- **Authentication and protected writes:** the application uses real authentication for write actions where configured.
- **Document upload UI:** the interface supports a document-upload-style flow for loan creation, although the actual document interpretation is mocked as described below.

---

## 3. What is mocked, stubbed, or hardcoded

Every shortcut. Examples: a login that accepts any password, a payment that always succeeds, an "AI" that is an if/else, a database that is an in-memory dictionary, fake JSON returned instead of a real API call.

**Undisclosed mocks carry a small penalty each. Anything you list here = free.**

| What is faked | Where (file:line or folder) | Why we mocked it | What the real version would do |
|---|---|---|---|
| Real HKMA CDI integration | `MOCK-CDI-API/`, backend CDI client in the loan-scoring service | We do not have access to the real HKMA Commercial Data Interchange during the hackathon | Call the real HKMA CDI with borrower consent and retrieve live commercial/trade/banking data |
| CDI risk signals | `MOCK-CDI-API/` | The demo needs realistic shipment, supplier, order-normality, and channel-risk signals without live CDI access | Return actual risk signals derived from consented commercial data |
| Borrower credit history | backend loan-scoring mock borrower DB / seeded borrower records | No real SME repayment or KYB history is available | Query real borrower repayment history, current exposure, KYB status, and compliance records |
| Historical scoring data on seeded loans | database seed/mock data | Existing demo loans need score data for display before real users create loans | Use scores generated from real transaction and borrower history at creation time |
| Transaction data completion | backend loan-scoring input invention/helper logic | The demo form collects fewer fields than a real underwriting workflow would require | Extract transaction data from real invoices, purchase orders, logistics documents, collateral records, and user-provided evidence |
| Document extraction / “LLM extraction” | frontend/backend mock extraction helper for loan creation | We keep the upload-style UX but do not run OCR or an LLM | Parse uploaded documents with OCR/LLM/document AI and extract structured invoice, shipment, supplier, and collateral data |
| Collateral verification | scoring rules and demo inputs | We cannot legally verify collateral, warehouse control, or insurance coverage in the demo | Verify collateral ownership, enforceability, insurance, warehouse receipts, and legal control |
| Some company/public-register data | seeded data / hardcoded demo records | No live company-registry integration is included | Query official company registers, litigation/winding-up records, and compliance sources |

---

## 4. External APIs, services & data sources

Everything the project calls or pretends to call. Mark each as real or mocked.

| Service / API / dataset | Used for | Real call or mocked? | Auth (sandbox / test key / none) |
|---|---|---|---|
| PostgreSQL | Primary datastore for loans/deals, bids, users/companies, and persisted credit scores | Real local service | Local credentials via environment variables |
| Mock CDI API | CDI-style transaction enrichment for shipment, supplier, order-normality, and channel-risk scoring | Real HTTP call to a mocked service | None / internal service |
| HKMA Commercial Data Interchange | Intended real-world source for consented commercial data | Not connected; represented by Mock CDI API | n/a |
| Keycloak | Authentication / identity provider where configured | Real local service | Local realm/client configuration |
| MinIO | Document/object storage where configured | Real local service | Local access/secret keys |
| MCP endpoint | Exposes selected marketplace data to MCP clients where configured | Real endpoint backed by app data | None / public read, depending on configuration |

---

## 5. Pre-existing code

Anything written **before** kickoff that we brought into this project: prior personal projects, forked open-source code, templates, boilerplate, internal libraries.

**Undisclosed pre-built code is heavily penalized. Anything you list here = free.**

"All code in this repo was written during the hackathon window."

---

## 6. Known limitations & next steps

What we would build next, and the weak spots we already know about. Naming these honestly is a strength, not a flaw.

- Replace the Mock CDI API with a real HKMA CDI integration using proper borrower consent and production authentication.
- Replace hardcoded/seeded borrower history with real repayment, exposure, KYB, and compliance data.
- Replace fake document extraction with real OCR/LLM/document-AI extraction from invoices, purchase orders, shipment records, and collateral documents.
- Add real legal and operational collateral verification.
- Add production-grade KYC/AML, sanctions screening, settlement, escrow, and regulatory controls before any real lending use.
- Improve the scoring model with validation against historical default/loss data instead of hand-designed weights.
- Remove or clearly separate any remaining legacy/demo scoring paths once the backend-owned scoring flow is fully authoritative.
```
