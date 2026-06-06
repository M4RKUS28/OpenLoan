# OpenLoan

**An open marketplace for trade finance** — built for the Hong Kong FinTech Hackathon.

OpenLoan lets small and medium trading businesses raise capital for individual trade
deals, while capital providers (banks, private credit funds, family offices, qualified
investors) compete in an open auction to fund them. Instead of one bank deciding, the
market discovers the rate — deal by deal. The first focus market is Hong Kong and the
Greater Bay Area.

> **Demo disclaimer.** This is a hackathon MVP that demonstrates the marketplace flow.
> It is **not** a regulated financial product. Figures are illustrative, and the
> **OpenLoan Score is a placeholder** — the real risk-scoring engine is out of MVP scope.
> CDI (HKMA) and CargoX are referenced as the intended data sources, not yet integrated.

---

## What it does

- **Public marketplace** — browse current and past deals with search and filters
  (status, industry, trade type, risk grade, sort). Viewable signed-out.
- **Deal detail** — full trade description, company profile, OpenLoan Score breakdown,
  live bids, attached documents, dates.
- **Post a deal** (business) — requested amount, goods, term, route, file uploads;
  a placeholder OpenLoan Score is computed on submission. New deals start `pending`.
- **Open auction** (lender) — place competing bids; the lowest rate leads; the business
  accepts a winning bid.
- **Dashboard** — your deals / your bids depending on account mode.
- **Account mode toggle** — switch between *business* and *lender* views in the header
  (client-side; persisted in `localStorage`).
- **Explainer pages** — how CDI powers the score, the MCP connector, and an About page.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, custom UI kit (shadcn-style) |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Auth (client) | keycloak-js (PKCE) |
| Backend | FastAPI, Python 3.12, uv |
| Auth (server) | python-keycloak, JWT via JWKS |
| ORM | SQLAlchemy 2.0 async + `mapped_column` |
| Migrations | Alembic |
| Config | pydantic-settings |
| Database | PostgreSQL 16 |
| Object storage | MinIO (deal documents) |
| Proxy | Nginx |
| Auth server | Keycloak 24 |

---

## Domain model

| Model | Purpose |
|---|---|
| `Company` | A trading business profile (industry, country, revenue, contact). |
| `Loan` | A single trade deal: goods, amount, term, route, status, placeholder score. |
| `Bid` | A lender's competing offer (amount, rate, message, status) on a deal. |
| `File` | A document attached to a deal (stored in MinIO), used as a scoring signal. |

A deal moves through `pending → open → funded` (with `rejected` as a side path). The
marketplace ships with seeded demo companies, deals and bids so it is populated on first run.

---

## API overview

All routes are under `/v1` (proxied at `/api/v1` through Nginx). Marketplace reads are
public; writes require a Keycloak-authenticated user.

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/loans` | optional | Marketplace list. Filters: `search`, `status`, `industry`, `trade_type`, `risk_grade`, `sort`, `offset`, `limit`. |
| `GET` | `/v1/loans/industries` | public | Distinct industries (for filters). |
| `GET` | `/v1/loans/mine` | required | Deals owned by the current user. |
| `POST` | `/v1/loans` | required | Create a deal request (computes placeholder score). |
| `GET` | `/v1/loans/{id}` | optional | Deal detail: score breakdown, documents, bids. |
| `POST` | `/v1/loans/{id}/approve` · `/reject` | required | Move a pending deal to `open` / `rejected`. |
| `GET` | `/v1/loans/{id}/bids` | optional | List bids on a deal. |
| `POST` | `/v1/loans/{id}/bids` | required | Place a bid. |
| `POST` | `/v1/loans/{id}/bids/{bid_id}/accept` | required | Business accepts a winning bid. |

Additional routers: `companies` (profiles), `bids`, `files` (presigned upload/download).
Interactive docs at `http://localhost:8000/docs`.

---

## Frontend routes

| Path | Page |
|---|---|
| `/` | Landing (hero, how it works, scoring, auction, FAQ) |
| `/marketplace` | Deal listings with filters |
| `/deals/:id` | Loan / deal detail |
| `/deals/new` | Post a new deal |
| `/dashboard` | Your deals / bids |
| `/cdi` | How CDI powers the OpenLoan Score |
| `/mcp` | MCP connector explainer |
| `/about` | Team, mission, roadmap |
| `/signin`, `/signup` | Auth (redirect to Keycloak) |

---

## Services & ports

| Service | Internal | Exposed (dev) |
|---|---|---|
| Nginx | 80 | 80 |
| Frontend (Vite) | 5173 | 5173 |
| Backend (FastAPI) | 8000 | 8000 |
| Keycloak | 8080 | 8080 |
| PostgreSQL | 5432 | 5432 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 9001 |

In production all traffic goes through Nginx on port 80/443. Keycloak runs on a separate
subdomain (`auth.yourdomain.com`).

### Nginx routing (prod)

```
yourdomain.com/api/*   →  backend:8000
yourdomain.com/        →  frontend:80  (SPA fallback)
auth.yourdomain.com    →  keycloak:8080
```

---

## Getting started

```bash
cp .env.example .env
# edit .env — set DOMAIN, AUTH_DOMAIN, passwords, secrets

# Dev (hot reload)
docker compose up

# Production
docker compose -f docker-compose.yml up -d
```

**First run:**

1. Open Keycloak at `http://localhost:8080`, create realm `app` and client `app-frontend`
   (public client, PKCE enabled, redirect URI `http://localhost/*`).
2. Apply database migrations (also seeds the demo marketplace):
   ```bash
   docker compose exec backend uv run alembic upgrade head
   ```
3. Open the app at `http://localhost/`.

---

## Dev notes & gotchas

- **Windows host file watching.** Bind mounts from a Windows host into the Linux
  containers don't reliably deliver inotify events, so Vite is configured with
  `server.watch.usePolling` ([frontend/vite.config.ts](frontend/vite.config.ts)) to keep
  HMR working.
- **Config files are bind-mounted in dev.** `docker-compose.override.yml` mounts the
  frontend config files (`tailwind.config.ts`, `index.html`, `vite.config.ts`,
  `postcss.config.js`, tsconfigs) in addition to `src/` and `public/`. Changing the
  **Tailwind theme/config** requires restarting the frontend container so Tailwind
  reloads it: `docker compose restart frontend`.
- **Recreating the frontend container changes its IP**, which can leave Nginx pointing at
  a stale upstream (502). If that happens: `docker compose restart nginx`.
- **Theme.** The UI uses a warm "East-meets-West editorial fintech" palette (ivory paper,
  Victoria-Harbour teal, Hong Kong vermilion, jade, gold) defined in
  [frontend/tailwind.config.ts](frontend/tailwind.config.ts). Landing-page photography is
  hotlinked from Wikimedia Commons (see [frontend/src/lib/images.ts](frontend/src/lib/images.ts)).
- **Type checking.** `docker compose exec frontend npx tsc -p tsconfig.json --noEmit`.

---

## Project structure

```
.
├── docker-compose.yml            # production
├── docker-compose.override.yml   # dev (hot reload, exposed ports, config mounts)
├── .env.example
├── nginx/
│   └── conf.d/{default.conf, dev.conf}
├── backend/
│   ├── Dockerfile, pyproject.toml, alembic.ini
│   ├── alembic/                  # migrations (incl. marketplace + seed)
│   └── src/
│       ├── main.py
│       ├── config/settings.py    # env vars via pydantic-settings
│       ├── core/                 # auth (JWT/JWKS), exceptions
│       ├── db/
│       │   ├── database.py, minio.py
│       │   ├── models/           # company, loan, bid, file
│       │   └── crud/             # async CRUD per model
│       ├── services/             # loan/bid/file services + scoring (placeholder)
│       └── api/v1/               # router, schemas, endpoints
└── frontend/
    └── src/
        ├── main.tsx, router.tsx, index.css
        ├── lib/                  # auth, api, query-client, images, utils
        ├── hooks/                # TanStack Query hooks (loans, bids, company, auth)
        ├── context/              # AccountMode (business / lender toggle)
        ├── components/
        │   ├── ui/               # Button, Badge, Logo, ScoreGauge, Modal, …
        │   ├── AppHeader.tsx, Footer.tsx, SiteLayout.tsx
        │   ├── LoanCard.tsx, BidDialog.tsx
        │   └── ProtectedRoute.tsx
        └── pages/                # one file per route
```

---

## Adding a new API resource

1. Add a SQLAlchemy model in `backend/src/db/models/` and register it in `models/__init__.py`
2. Add CRUD in `backend/src/db/crud/`
3. Add business logic in `backend/src/services/`
4. Add Pydantic schemas in `backend/src/api/v1/schemas/`
5. Add an endpoint file in `backend/src/api/v1/endpoints/` and register it in `api/v1/router.py`
6. Create and apply a migration:
   `uv run alembic revision --autogenerate -m "add_thing"` → `uv run alembic upgrade head`
