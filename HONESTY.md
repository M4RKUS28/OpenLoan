# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of the repository.
> Judges cross-check it against our code and our technical video. Disclosed shortcuts are
> not penalized — that is the point of this file.

---

## 1. Team — who did what

Cross-check against `git shortlog -sn`.

| Member | GitHub handle | Main contributions |
|---|---|---|
| Markus Huber | `Markus` / `Markus Huber` | Full-stack: backend (FastAPI, SQLAlchemy, scoring, seed), frontend, infra (Docker, Nginx, Keycloak) |
| Jonas Bela Hörter | `Jonas Bela Hörter` | Frontend / fixes |

---

## 2. What is fully working

Features that run end-to-end on the live app with real data and real logic.

- **Public marketplace** — `GET /v1/loans` with real server-side filtering (search, status,
  industry, trade type, risk grade), sorting, and pagination against PostgreSQL. Browsable
  signed-out.
- **Deal detail** — `GET /v1/loans/{id}` returns the full trade description, company profile,
  score breakdown, attached documents, and live bids.
- **Post a deal** (business) — `POST /v1/loans` persists a new deal request and computes a score
  on submission. New deals start `pending`.
- **Open auction / bidding** (lender) — `POST /v1/loans/{id}/bids` places real competing bids;
  lowest rate leads; `POST .../bids/{id}/accept` lets the business accept a winning bid. Approve /
  reject flow (`pending → open / rejected`) is real.
- **Authentication** — real Keycloak (OIDC/PKCE on the client, JWT validated server-side against
  Keycloak's JWKS in [backend/src/core/auth.py](backend/src/core/auth.py)). Marketplace reads are
  public; writes require a valid token.
- **Document upload/download** — files stored in MinIO via presigned URLs.
- **Dashboard & account-mode toggle** — your-deals / your-bids views; business/lender toggle
  persisted in `localStorage`.

---

## 3. What is mocked, stubbed, or hardcoded

| What is faked | Where | Why we mocked it | What the real version would do |
|---|---|---|---|
| **OpenLoan Score** is a deterministic placeholder formula, not a credit model | [backend/src/services/scoring.py](backend/src/services/scoring.py) | A real risk-scoring engine is out of MVP scope | Score from real CDI banking/accounting data, CargoX trade docs, repayment history and external signals |
| Marketplace is **pre-seeded** with demo companies, deals and bids | [backend/src/services/seed.py](backend/src/services/seed.py) (run via Alembic migration) | So the app is populated on first run for the demo | Data would accumulate from real user activity |
| The score factor weights shown on the **/cdi** page (25/25/20/15/15) are illustrative UI copy | [frontend/src/pages/CDI.tsx](frontend/src/pages/CDI.tsx) | Explainer content, not a live model output | Reflect the real model's learned/validated weights |

---

## 4. External APIs, services & data sources

| Service / API / dataset | Used for | Real call or mocked? | Auth |
|---|---|---|---|
| **Keycloak** | User auth (login, JWT, JWKS validation) | **Real** | Realm `app`, client `app-frontend` (PKCE) |
| **PostgreSQL 16** | Primary datastore (companies, loans, bids, files) | **Real** | Local credentials via env |
| **MinIO** | Object storage for deal documents (presigned upload/download) | **Real** | Local access/secret keys |
| **CDI (HKMA Commercial Data Interchange)** | Intended source of banking/accounting data for scoring | **Not integrated** — referenced/explained only ([/cdi](frontend/src/pages/CDI.tsx)) | none |
| **CargoX** | Intended source of trade-document / e-B/L signals | **Not integrated** — referenced/explained only | none |
| **MCP Connector** | Exposing the marketplace to AI apps | **Not built** — forward-looking concept page only ([MCPConnector.tsx](frontend/src/pages/MCPConnector.tsx)) | none |

---

## 5. Pre-existing code

All application code in this repo was written during the hackathon window
(first commit 2026-06-06, this submission 2026-06-07).

Standard scaffolding/dependencies used as-is (not hand-written during the hack): React + Vite
+ Tailwind project template, a shadcn-style UI kit, FastAPI / SQLAlchemy / Alembic boilerplate,
and the official Keycloak / PostgreSQL / MinIO / Nginx Docker images. Landing-page photography is
hotlinked from Wikimedia Commons.

---

## 6. Known limitations & next steps

- **No real risk model.** Replace the placeholder score with a model fed by real CDI and CargoX data.
- **CDI / CargoX / MCP are not integrated** — they are the intended architecture, shown on explainer
  pages, not live integrations.
- **Not a regulated product.** Figures are illustrative; no KYC/AML, settlement, or escrow.
- **Keycloak realm/client must be configured manually on first run** (see README) — not yet automated.
- **Seeded demo data** ships with the app; there is no production data lifecycle yet.
