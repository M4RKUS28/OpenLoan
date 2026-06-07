# HONESTY.md

> Mandatory disclosure for the hackathon. This file lives at the root of the repository.
> Judges cross-check it against our code and our technical video. Disclosed shortcuts are
> not penalized — that is the point of this file.

---

## 1. Team — who did what

Cross-check against `git shortlog -sn`.

| Member | GitHub handle | Main contributions |
|---|---|---|
| Markus Huber | `Markus Huber` | Full-stack: backend (FastAPI, SQLAlchemy), MCP server, infra (Docker, Nginx, Keycloak), frontend, seed |
| Jonas Bela Hörter | `Jonas Bela Hörter` | Loan-scoring engine (`loan_scoring/`), mock-CDI integration, scoring UI, demo payloads |
| ypxz | `ypxz` | Frontend changes (header, footer, logo, landing & page polish), this HONESTY file |

---

## 2. What is fully working

Features that run end-to-end on the live app with real data and real logic.

- **Public marketplace** — `GET /v1/loans` with real server-side filtering (search, status,
  industry, trade type, risk grade), sorting, and pagination against PostgreSQL. Browsable
  signed-out.
- **Deal detail** — `GET /v1/loans/{id}` returns the full trade description, company profile,
  score breakdown, attached documents, and live bids.
- **Post a deal** (business) — `POST /v1/loans` persists a new deal and runs the loan-scoring
  engine on submission. New deals start `pending`.
- **Loan-scoring engine** — a real, rules-based credit-scoring system
  ([backend/src/services/loan_scoring/](backend/src/services/loan_scoring/)): borrower + transaction
  components, weighted points, A–E grade, and "showstopper" hard-stops. It makes a live HTTP call to
  a CDI enrichment service and folds the response into the score.
- **Open auction / bidding** (lender) — `POST /v1/loans/{id}/bids` places real competing bids;
  lowest rate leads; `POST .../bids/{id}/accept` lets the business accept a winning bid. Approve /
  reject flow (`pending → open / rejected`) is real.
- **MCP server** — a working Model Context Protocol Streamable-HTTP endpoint at `/mcp`
  ([backend/src/api/mcp.py](backend/src/api/mcp.py)) exposing `list_auctions` and `get_auction`
  tools backed by live marketplace data. Usable from MCP clients (Claude, MCP Inspector).
- **Authentication** — real Keycloak (OIDC/PKCE on the client, JWT validated server-side against
  Keycloak's JWKS in [backend/src/core/auth.py](backend/src/core/auth.py)). Reads public; writes
  require a valid token.
- **Document upload/download** — files stored in MinIO via presigned URLs.
- **Dashboard & account-mode toggle** — your-deals / your-bids views; business/lender toggle
  persisted in `localStorage`.

---

## 3. What is mocked, stubbed, or hardcoded

| What is faked | Where | Why we mocked it | What the real version would do |
|---|---|---|---|
| **CDI data source** — the scoring engine calls our own **Mock CDI API**, not the real HKMA CDI | [MOCK-CDI-API/](MOCK-CDI-API/), called via [cdi_client.py](backend/src/services/loan_scoring/cdi_client.py) | No access to live HKMA CDI in the hackathon | Call the real HKMA Commercial Data Interchange for consented banking/trade data |
| **Borrower credit records** are a hardcoded in-memory dictionary (`brw_001`…) | [mock_borrower_db.py](backend/src/services/loan_scoring/mock_borrower_db.py) | No real borrower history/KYB data available | Look up real borrower history, repayment record and KYB from a datastore |
| **Scoring inputs are "invented"** — a few user fields are expanded into a full trade dossier (PO, invoice, shipment, supplier, collateral) via deterministic heuristics | [invent.py](backend/src/services/loan_scoring/invent.py) | The post-a-deal form collects far less than the scoring model needs | Use real documents/data the borrower actually submits |
| **Mock CDI risk signals** are generated from demo scenarios (`strong`/`medium`/`weak`/`hard_stop`), partly seeded/random | [mock_logic.py](MOCK-CDI-API/app/mock_logic.py) | To produce believable, varied demo scores | Return real risk signals derived from CDI data |
| Marketplace is **pre-seeded** with demo companies, deals and bids | [seed.py](backend/src/services/seed.py) (via Alembic migration) | So the app is populated on first run | Data accumulates from real user activity |
| Legacy placeholder formula `compute_score` still exists but is **superseded** by `loan_scoring` for new deals | [scoring.py](backend/src/services/scoring.py) | Earlier MVP scorer, kept during transition | Removed |
| The score factor weights on the **/cdi** page are illustrative UI copy | [CDI.tsx](frontend/src/pages/CDI.tsx) | Explainer content, not live model output | Reflect the real model's weights |

---

## 4. External APIs, services & data sources

| Service / API / dataset | Used for | Real call or mocked? | Auth |
|---|---|---|---|
| **Keycloak** | User auth (login, JWT, JWKS validation) | **Real** | Realm `app`, client `app-frontend` (PKCE) |
| **PostgreSQL 16** | Primary datastore (companies, loans, bids, files) | **Real** | Local credentials via env |
| **MinIO** | Object storage for deal documents (presigned upload/download) | **Real** | Local access/secret keys |
| **Mock CDI API** (our own FastAPI service) | CDI-style trade/shipment/supplier risk signals for scoring | **Real HTTP call to a mocked service** — stands in for HKMA CDI | none (internal service) |
| **HKMA CDI** (real) | Intended ultimate data source behind the mock | **Not connected** — simulated by the mock above | n/a |
| **CargoX** | Trade-document / e-B/L signals (described on /cdi) | **Not integrated** — referenced/explained only | none |
| **MCP server** (`/mcp`) | Exposing the marketplace to AI/MCP clients | **Real** (read-only tools) | none (public read) |

---

## 5. Pre-existing code

All application code in this repo was written during the hackathon window
(first commit 2026-06-06, this submission 2026-06-07).

Standard scaffolding/dependencies used as-is (not hand-written during the hack): React + Vite +
Tailwind project template, a shadcn-style UI kit, FastAPI / SQLAlchemy / Alembic boilerplate, and
the official Keycloak / PostgreSQL / MinIO / Nginx Docker images. The MCP endpoint implements the
public Model Context Protocol spec by hand (no MCP SDK). Landing-page photography is hotlinked from
Wikimedia Commons.

---

## 6. Known limitations & next steps

- **CDI is mocked.** The scoring engine and its CDI integration are real, but the data behind it
  comes from our own Mock CDI API and a hardcoded borrower database — not live HKMA CDI.
- **Scoring inputs are partly invented** from minimal form data, so demo scores are plausible rather
  than fully evidence-backed.
- **CargoX is not integrated** — it is referenced on the explainer page only.
- **Not a regulated product.** Figures are illustrative; no real KYC/AML, settlement, or escrow.
- **Keycloak realm/client must be configured manually on first run** (see README) — not yet automated.
- **Legacy `scoring.py`** should be removed now that `loan_scoring` is the live path.
- **MCP server is read-only and unauthenticated** — no bidding/write tools yet.
