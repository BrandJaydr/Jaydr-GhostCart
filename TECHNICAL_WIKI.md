# 🏗️ Jaydr GhostCart — Technical Wiki

> ## 📌 MAINTENANCE MEMO
>
> **This document is a LIVING artifact.** It must be reviewed and updated in lockstep
> with every meaningful code change, dependency bump, new migration, or architectural
> decision. When you add, remove, or significantly alter a file, update this Wiki as
> part of the same change. A stale Wiki is worse than no Wiki — it misleads new
> developers, onboards to the wrong assumptions, and erodes trust during handover
> (open-source release, sale, or outsourcing). Treat documentation like code: version
> it, review it, and keep `main` green.

> **Frontend compatibility notice (verified 2026-08-12):** Actual package versions are **Next.js 14.2.5, React 18.3.1, and HeroUI v2.8.10**. `tailwind.config.ts` reflects an intended Tailwind v3 setup, but `tailwindcss` is absent from the root manifest and lockfile. Treat Tailwind as an incomplete integration, not an installed runtime, until ERR-019 is resolved. The implementation authority is [UI Recovery Brief](Prism%20Working/UI_RECOVERY_BRIEF.md).

> **Deployment notice (verified 2026-08-12):** GhostCart is a standalone Docker-first modular monolith, not a WordPress plugin. The checked-in Compose file is for local development only and runs `app`, PostgreSQL, and Redis; production hosting is not configured. See ERR-020 and `tasks/todo.md` for the productionization gate.

---

## 1. Project Overview & Goals

### What It Is
**Jaydr GhostCart** is an enterprise reseller & dropshipping automation platform. It bridges
supplier catalog management with major online marketplaces (eBay, Amazon SP-API, Facebook
Marketplace, Etsy, Shopify). Core capabilities: multi-tenant catalog management,
AI-assisted listing generation/optimization, real-time repricing guardrails, and audit logging.

### Current Implementation Status: Stages 2–4 Verified Complete; Stage 5 Open
Per the [Production Blueprint and Delivery Guide](Docs/Production%20Blueprint%20and%20Delivery%20Guide.md),
GhostCart follows a **Modular Monolith** delivery model, not an early microservices rollout.
The current repository is in **Stages 2–4** (verified complete 2026-08; Stage 5 open). See §14/§15 for the verification log. Implemented:

- Real supplier adapter implementations (CSV, eBay)
- Stock/price refresh system with change detection (migration 0009)
- Margin calculation system (migration 0010)
- Repricing system with guardrails (migration 0011)
- AI-powered listing analysis and optimization
- Enhanced RLS policies and audit trails
- 14 database migrations (0001–0014)

The Stage 1 thin vertical slice remains the foundation:
> A signed-in merchant imports an approved supplier product, reviews normalized data and
> pricing, generates an editable listing draft, and exports or submits that draft through one
> approved marketplace path.

Technical debt remains (168 TODO markers across 34 files) — see §13 for investigation findings.

### Aspirational vs. Current Architecture — Important Distinction
Several documents in this repository describe a **much larger future state** than what the
code currently implements. These are vision/roadmap documents, not the current architecture:

- `Docs/Jaydr GhostCart Plan` — describes Kafka, microservices, API Gateway, CRM, etc.
- `tasks/plan.md` — describes 7 microservices, Node + Python, InfluxDB, etc.
- `Docs/Frontend UI Component Tree.md` — describes a WordPress admin plugin with ~30 screens.
- `Docs/Jaydr Ghostcart Project Concept.txt` — original brainstorming.
- `Docs/CHECK LIST AND FAQ.md` — marketing copy / FAQ content.

⚠️ **The actual code is a single Next.js app (TypeScript) with PostgreSQL + BullMQ.** All
microservice/event-bus/WP-plugin content is deferred to Stage 3+ and is **not yet
implemented**. See `tasks/todo.md` for the staged delivery path.

### Phased Delivery Roadmap
(Condensed from `tasks/todo.md` and `Docs/Production Blueprint and Delivery Guide.md`)

| Stage | Goal | Entry Criteria |
|---|---|---|
| 0 | Product validation & operating constraints | — |
| 1 | Foundation + clickable workflow | Scaffold, Docker Compose, schema, 4 screens, mock adapter, health test |
| 2 | Real supplier import & enhanced features (✅ verified 2026-08) | Stage 1 complete; CSV/eBay adapters, normalization, review-before-use, refresh |
| 3 | Marketplace submission + audit history (✅ verified 2026-08) | Stage 2 stable; eBay submit/CSV export, webhooks, job activity/retry/kill |
| 4 | Reliability & controlled automation (**current state**: 7/8 — 1 hardening item open) | Stage 3 stable; refresh, margin, repricing, dashboards, rate limiting |
| 5 | Expand integrations & team capabilities (open) | Stage 4 stable; second marketplace, roles/invitations, orders, analytics |
| 6 | Scale & enterprise options (future) | Sustained measured load, bounded services |

## 2. Architecture Overview (Current)

```
Browser (React / Next.js, TS)
  │
  ▼
Next.js Web + API Server (src/app/)
  │
  ├─► PostgreSQL  (src/db/migrations/0001-0015.sql) — source of truth
  │
  ├─► BullMQ ←→ Redis  (src/lib/queue/index.ts, src/worker/index.ts) — async import + refresh pipeline
  │
  ├─► AI Services  (src/lib/ai/) — Ollama/VLLM integration for listing optimization
  │
  └─► Supplier Adapters  (src/lib/adapters/) — normalized via ISupplierAdapter interface
```

**Stack:**
- **Frontend & API:** React 18.3 / Next.js 14.2 (App Router, TypeScript)
- **Database:** PostgreSQL 16 (multi-tenant, tenant_id columns, RLS implemented, 15 migrations)
- **Queue:** BullMQ backed by Redis 7 (import + refresh workers)
- **Background worker:** separate Node process (`npm run worker`) using `ts-node --esm`
- **AI Services:** Ollama/VLLM integration with cache management
- **Containerization:** Docker Compose (db, redis, app services)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Lint/Format:** ESLint + Prettier

## 3. Directory Map

```
Jaydr-GhostCart/
│
├── 📄  .env.example                 Template for all required environment variables (DB, Redis, auth, sandbox keys).
├── 📄  .eslintrc.json               ESLint config: Next.js core + TypeScript rules, no-explicit-any enforced.
├── 📄  .prettierrc                  Prettier config: 2-space tabs, single quotes, 100-char print width, import ordering.
├── 📄  docker-compose.yml           Local dev stack: PostgreSQL 16, Redis 7, Node.js app container.
├── 📄  package.json                 npm manifest — deps (next, react, next-auth, bullmq, pg, zod), scripts, engine reqs.
├── 📄  playwright.config.ts         Playwright E2E config (chromium only, auto-starts dev server in CI).
├── 📄  tsconfig.json                TypeScript config: strict mode, @/* → ./src/* path alias, ESNext.
├── 📄  vitest.config.ts             Vitest config: jsdom env, setup file, v8 coverage.
├── 📄  README.md                    Project README (product vision, quickstart, AOP-CORE pipeline overview).
│
├── 📁  Docs/                        Project documentation (see §10 for what is excluded).
│   ├── 📄  Production Blueprint and Delivery Guide.md   ★ Core: architecture, stages, DoD, non-goals.
│   ├── 📄  CHECK LIST AND FAQ.md    Marketing FAQ (NOT technical — reference only).
│   ├── 📄  Frontend UI Component Tree.md                 Aspirational UI spec (WordPress plugin vision, not current code).
│   ├── 📄  Jaydr GhostCart Plan     Aspirational backend architecture (microservices/Kafka — deferred to Stage 3+).
│   ├── 📄  Jaydr Ghostcart Project Concept.txt           Original brainstorming concept (not implementation).
│   └── 📁  Agents/                  EXCLUDED — agent prompt files (see §10).
│
├── 📁  src/                         Application source (everything below is the actual app).
│   ├── 📁  app/                     Next.js App Router — pages + API routes.
│   │   ├── 📄  layout.tsx           Root layout: global metadata, <html>/<body> shell.
│   │   ├── 📄  page.tsx            Root redirect → /import.
│   │   ├── 📁  (auth)/sign-in/
│   │   │   └── 📄  page.tsx        Sign-in screen stub (next-auth credentials, dev seed).
│   │   ├── 📁  (dashboard)/
│   │   │   ├── 📄  layout.tsx      Auth-gated layout: session guard + nav shell (stub).
│   │   │   ├── 📁  import/
│   │   │   │   └── 📄  page.tsx    Import form: paste supplier URL → POST /api/products.
│   │   │   ├── 📁  products/[id]/review/
│   │   │   │   └── 📄  page.tsx    Product review: normalized data + pricing + Generate Draft CTA.
│   │   │   └── 📁  listings/[id]/draft/
│   │   │       └── 📄  page.tsx    Listing draft editor: editable title/desc/attrs, state badge.
│   │   └── 📁  api/                  API route handlers (App Router endpoints).
│   │       ├── 📁  health/
│   │       │   └── 📄  route.ts    GET /api/health — returns {status:'ok'}, 200.
│   │       ├── 📁  products/
│   │       │   └── 📄  route.ts    GET/POST /api/products — stubs, return 501 (pending Atlas).
│   │       └── 📁  listings/
│   │           └── 📄  route.ts    GET/POST /api/listings — stubs, return 501 (pending Atlas).
│   │
│   ├── 📁  __tests__/               Vitest unit/integration tests.
│   │   ├── 📄  setup.ts            Test setup: imports @testing-library/jest-dom.
│   │   └── 📄  health.test.ts      Stage 1 gate test: verifies GET /api/health → 200 + JSON.
│   │
│   ├── 📁  components/ui/           Internal UI component library (all Stage 1 stubs).
│   │   ├── 📄  Button.tsx          <button> with variant/isLoading props (colors pending Stage 2).
│   │   ├── 📄  Input.tsx           Labeled <input> with error/helper text support.
│   │   ├── 📄  EmptyState.tsx      Empty list/empty-state presentation component.
│   │   ├── 📄  ErrorState.tsx      Error presentation with optional retry + error code.
│   │   ├── 📄  PageHeader.tsx      Standard <h1>-based page header with optional action slot.
│   │   └── 📄  StatusBadge.tsx     Maps ListingState → human-readable badge label.
│   │
│   ├── 📁  db/
│   │   └── 📁  migrations/
│   │       ├── 📄  0001_init.sql    Initial schema: 8 tables (tenants, users, suppliers, products, …).
│   │       ├── 📄  0002_harden.sql  Constraints, indexes, canonical product columns.
│   │       ├── 📄  0003_rls_seed.sql  RLS policies, app role, dev seed.
│   │       ├── 📄  0004_user_corrections.sql  User corrections tracking, idempotency.
│   │       ├── 📄  0005_ai_insights.sql  AI analysis results, cache tables.
│   │       ├── 📄  0005_import_alpha.sql  Import alpha features.
│   │       ├── 📄  0006_ebay_integration.sql  eBay-specific tables.
│   │       ├── 📄  0007_job_management.sql  Enhanced job tracking.
│   │       ├── 📄  0008_feature_flags.sql  Feature flag system.
│   │       ├── 📄  0009_stock_price_refresh.sql  Stock/price refresh with change detection.
│   │       ├── 📄  0010_margin_calculation.sql  Margin calculation system.
│   │       └── 📄  0011_repricing_system.sql  Repricing with guardrails.
│   │
│   ├── 📁  lib/                     Core application library.
│   │   ├── 📁  db/
│   │   │   └── 📄  index.ts        PostgreSQL Pool singleton (DATABASE_URL), graceful shutdown.
│   │   ├── 📁  queue/
│   │   │   └── 📄  index.ts        BullMQ: importQueue + listingQueue, shared IORedis conn.
│   │   ├── 📁  types/
│   │   │   └── 📄  canonical.ts    Canonical domain types: CanonicalProduct, ListingDraft, JobRecord, ListingState.
│   │   └── 📁  adapters/
│   │       ├── 📄  supplier.interface.ts   ISupplierAdapter — formal adapter contract.
│   │       └── 📄  mock.adapter.ts         MockSupplierAdapter — Stage 1 fixture data.
│   │
│   └── 📁  worker/
│       └── 📄  index.ts             Background worker entrypoint: registers BullMQ 'product.import' worker (stub).
│
├── 📁  tasks/                       Delivery planning & tracking.
│   ├── 📄  plan.md                  High-level phased plan (note: aspirational in places — see §2).
│   └── 📄  todo.md                  ★ Detailed Stage 0–6 checklist with exit gates.
│
├── 📁  .cortex/                     EXCLUDED — agent automation logs (see §10).
├── 📁  .jules/                      EXCLUDED — agent prompt/config (see §10).
├── 📁  .logs/                       EXCLUDED — AOP-CORE shared memory registers (see §10).
├── 📁  .windsurf/                   EXCLUDED — agent rules (see §10).
├── 📄  Dockerfile.dev               MISSING — referenced by docker-compose.yml but not yet created.
├── 📄  .gitignore                   MISSING — should be added before open-sourcing.
├── 📄  phpcs.xml                    EXCLUDED — stale PHP config, not used by this Node project.
├── 📄  dropshipping-websites-master.zip   EXCLUDED — unrelated reference material.
└── 📄  French centric drop shipping list.md — EXCLUDED — reference, not project code.

```

---

## 4. File-by-File Reference

### 4.1 Root Configuration

| File | Purpose | Key Details |
|---|---|---|
| `package.json` | npm manifest, deps & scripts | **Scripts:** `dev` (next dev), `build`, `start`, `worker` (ts-node), `test` (vitest), `lint`, `format`, `format:check`, `test:e2e`. **Deps:** next 14.2, react 18.3, next-auth 4.24, bullmq 5.7, pg 8.12, zod 3.23, clsx. **DevDeps:** typescript 5.5, eslint 8.57, prettier 3.3, vitest 2.0, playwright 1.45, ts-node 10.9, jsdom, @testing-library, @vitejs/plugin-react. **Engines:** Node ≥20. |
| `tsconfig.json` | TypeScript compiler config | Strict mode, ES2022 target, `@/*` → `./src/*` alias, `jsx: preserve`, `incremental: true`. |
| `vitest.config.ts` | Unit test config | jsdom environment, globals on, setup file `./src/__tests__/setup.ts`, v8 coverage provider (text/json/html). Uses `@vitejs/plugin-react`. |
| `playwright.config.ts` | E2E test config | Test dir `./e2e` (does not yet exist), chromium only, CI mode auto-starts dev server. |
| `.eslintrc.json` | Linter config | Extends `next/core-web-vitals` + `@typescript-eslint/recommended`. Rules: no unused vars (`^_` allowed), no explicit `any`, type-imports required, no-console is warn. Ignores node_modules/.next/dist. |
| `.prettierrc` | Formatter config | semi, single quotes, trailing comma all, 100 width, 2-space tabs, import ordering (react/next → third-party → @/ → relative). |
| `docker-compose.yml` | Local dev orchestration | **Services:** `db` (postgres:16-alpine, mounts `./src/db/migrations` as init), `redis` (redis:7-alpine, AOF persistence), `app` (builds from `./Dockerfile.dev`, mounts project root, depends on db+redis health). **Volumes:** `ghostcart_pgdata`, `ghostcart_redisdata`. |
| `.env.example` | Environment template | Variables: `DATABASE_URL`, `POSTGRES_PASSWORD`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DEV_SEED_EMAIL/PASSWORD`, `DEV_TENANT_ID`, `EBAY_*`/`AMAZON_*` stubs, `LOG_LEVEL`. |

### 4.2 Application (`src/app/`)

| File | Purpose | Key Details |
|---|---|---|
| `app/layout.tsx` | Root HTML/shell layout | Exports `metadata` (title template `'%s | GhostCart'`, robots index=false). Wraps `<body>` with children; TODOs for AuthSessionProvider, fonts, theme/toast containers. |
| `app/page.tsx` | Root redirect | Immediately `redirect('/import')` — auth guard lives in dashboard layout. |
| `app/api/health/route.ts` | `GET /api/health` | Returns `{ status: 'ok' }`, 200. Health check for Docker/CI/monitoring. TODOs: DB connectivity check, queue depth, version/uptime/correlation ID. |
| `app/api/products/route.ts` | `GET` & `POST /api/products` | **Stage 1 stubs** → return 501. Documented contracts: GET returns paginated `{data, pagination}`; POST enqueues import job, returns 202 + `{jobId, status}`. TODOs: tenant filtering, Zod validation, idempotency. |
| `app/api/listings/route.ts` | `GET` & `POST /api/listings` | **Stage 1 stubs** → return 501. Documents listing state machine: `draft→ready_for_review→queued→submitted→published→failed`. TODOs: tenant filter, status filter, draft creation. |
| `app/(auth)/sign-in/page.tsx` | Sign-in screen | Stub. TODOs: implement `<SignInForm>`, wire next-auth `signIn()`, document auth flow. Uses dev seed credentials from `.env`. |
| `app/(dashboard)/layout.tsx` | Dashboard layout | Stub. Responsibilities: session validation → redirect to /sign-in if unauthenticated; tenantId propagation; app shell (sidebar + content). |
| `app/(dashboard)/import/page.tsx` | Import form (Screen 2) | Stub. Flow: paste supplier URL → POST /api/products → importQueue → worker → normalized product → redirect to /products/[id]/review. TODOs: `<ImportForm>`, `<EmptyState>`. |
| `app/(dashboard)/products/[id]/review/page.tsx` | Product review (Screen 3) | Stub. Props: `{ params: { id } }`. Flow: GET /api/products/[id] → display CanonicalProduct fields + confidence/errors + "Generate Draft" CTA → POST /api/listings. Uses mock fixture data for Stage 1. |
| `app/(dashboard)/listings/[id]/draft/page.tsx` | Listing draft (Screen 4 — terminal Stage 1 deliverable) | Stub. Props: `{ params: { id } }`. Flow: GET/PUT /api/listings/[id]; editable fields; state indicator; Save Draft; Export/Submit (Stage 3). |

### 4.3 UI Components (`src/components/ui/`)

All are **Stage 1 stubs** — they render semantic HTML with TODOs for design tokens/styles.

| File | Exports | Props |
|---|---|---|
| `Button.tsx` | `Button`, `ButtonProps` | `variant` (primary/secondary/ghost/danger), `isLoading`, passes through `ButtonHTMLAttributes`. |
| `Input.tsx` | `Input`, `InputProps` | `label` (required), `error?`, `helperText?`, extends `InputHTMLAttributes`. |
| `EmptyState.tsx` | `EmptyState`, `EmptyStateProps` | `title`, `description?`, `action?` (ReactNode). |
| `ErrorState.tsx` | `ErrorState`, `ErrorStateProps` | `title`, `message?`, `onRetry?`, `errorCode?`. |
| `PageHeader.tsx` | `PageHeader`, `PageHeaderProps` | `title` (renders h1), `subtitle?`, `action?`. |
| `StatusBadge.tsx` | `StatusBadge`, `StatusBadgeProps` | `status: ListingState` — maps state to human-readable label; colors/icons pending Stage 2. |

### 4.4 Core Library (`src/lib/`)

| File | Exports | Purpose |
|---|---|---|
| `lib/db/index.ts` | `db` (Pool), SIGTERM handler | PostgreSQL connection pool (max 10, 30s idle timeout, 5s connect timeout). Throws if `DATABASE_URL` unset. Graceful drain on SIGTERM. TODOs: migrations runner, pool monitoring, tenant_id query helper. |
| `lib/queue/index.ts` | `redis` (IORedis), `importQueue`, `listingQueue` | BullMQ queues backed by Redis. `product.import` queue (3 retries, exponential backoff 2s, 24h complete / 7d failed retention). `listing.submit` queue (Stage 3). TODOs: typed payloads, job retry tuning. |
| `lib/types/canonical.ts` | `CanonicalProduct`, `ListingDraft`, `ListingState`, `FieldConfidence`, `JobType`, `JobRecord` | **Domain canonical models.** All adapters normalize to `CanonicalProduct`. Defines listing state machine enum + job lifecycle. |
| `lib/adapters/supplier.interface.ts` | `ISupplierAdapter` | Formal adapter contract: `adapterId`, `validateConnection()`, `importProduct(url, tenantId)`, `fetchProduct(productId, tenantId)`. App layer depends only on this interface. |
| `lib/adapters/mock.adapter.ts` | `MockSupplierAdapter`, `mockAdapter` | Stage 1 fixture adapter implementing `ISupplierAdapter`. Returns hardcoded `CanonicalProduct` with "FIXTURE" prefix. Swappable via adapter factory (TODO Stage 2). |

### 4.5 Worker (`src/worker/`)

| File | Purpose | Key Details |
|---|---|---|
| `worker/index.ts` | Background job processor | Registers BullMQ `Worker('product.import', …)` with concurrency 5. Currently throws "not yet implemented" — TODOs: resolve adapter by supplierId, call `importProduct`, persist to `products` + `product_sources`, create `audit_event`. Graceful shutdown on SIGTERM. Run via `npm run worker`. |

### 4.6 Database Migrations (`src/db/migrations/`)

| File | Purpose | Key Details |
|---|---|---|
| `0001_init.sql` | Initial schema | Creates `pgcrypto` extension. **8 tables:** `tenants`, `users`, `suppliers`, `products`, `product_sources`, `listing_drafts`, `marketplace_connections`, `jobs`, `audit_events`. All tenant-scoped (`tenant_id` FK). RLS, constraints, and some indexes are TODOs (@agent:archivist). Migrations mounted read-only into the postgres Docker container's `/docker-entrypoint-initdb.d/`. |

### 4.7 Tests (`src/__tests__/`)

| File | Purpose | Key Details |
|---|---|---|
| `setup.ts` | Vitest setup file | Imports `@testing-library/jest-dom`. TODOs: global test DB setup/teardown, fixture seeding (Stage 2). |
| src/__tests__/health.test.ts` | Unit test | Stage 1 gate test: asserts `GET()` returns 200 + `{status:\'ok\'}` + JSON content-type. Imports directly from `@/app/api/health/route`. |
249→
### 4.8 Authentication

| File | Purpose | Key Details |
|---|---|---|
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth.js route handler | Handles all authentication requests (sign-in, sign-out, session management). Uses a `CredentialsProvider` to authenticate a developer user against credentials stored in `.env`.|
| `src/app/AuthProvider.tsx` | Session Provider | A client-side component that wraps the application in a NextAuth.js `SessionProvider`, making the session available globally. |
| `src/components/SignInForm.tsx` | Sign-in Form | A client-side component containing the sign-in form. It uses the `signIn` function from `next-auth/react` to authenticate the user. |
| `src/app/(auth)/sign-in/page.tsx` | Sign-in Page | The page where users are directed to sign in. It uses the `SignInForm` component. |
| `src/app/(dashboard)/layout.tsx` | Dashboard Layout | Protects all dashboard routes. It uses `getServerSession` to check for a valid session on the server side and redirects unauthenticated users to the sign-in page. |

250→## 5. Environment Configuration (`.env.example`)

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://ghostcart:ghostcart_dev@localhost:5432/ghostcart` | PostgreSQL connection string (required). |
| `POSTGRES_PASSWORD` | `ghostcart_dev` | Used by docker-compose for the `db` service env & fallback. |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for BullMQ queue (required). |
| `NEXTAUTH_SECRET` | *(generated)* | next-auth session signing secret — **rotate before production.** |
| `NEXTAUTH_URL` | `http://localhost:3000` | next-auth callback URL. |
| `DEV_SEED_EMAIL` | `dev@ghostcart.local` | Stage 1 dev-only seed user credentials. Remove before production. |
| `DEV_SEED_PASSWORD` | *(set by dev)* | Stage 1 dev-only seed user password. |
| `DEV_TENANT_ID` | `tenant_dev_001` | Stage 1 fixture tenant ID. |
| `EBAY_APP_ID` / `EBAY_CERT_ID` | (empty) | eBay API credentials — stubs, not populated until Stage 2+. |
| `AMAZON_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` | (empty) | Amazon SP-API credentials — stubs. |
| `LOG_LEVEL` | `info` | Console log verbosity. TODO: add structured logging/tracing (Stage 4). |

## 6. Development Workflow

### Local Setup
```bash
# 1. Copy env template (never commit .env)
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET (openssl rand -base64 32) and DEV_SEED_PASSWORD

# 2. Start infra (if Docker available)
docker-compose up -d       # → postgres:5432, redis:6379, app:3000

# 3. Install deps + dev server
npm install
npm run dev              # → http://localhost:3000

# 4. Run tests
npm test                 # vitest unit tests
npm run test:watch       # watch mode during development
npx playwright test      # E2E (requires running dev server)
```

### Scripts Reference (`package.json`)
| Script | Command | Usage |
|---|---|---|
| `dev` | `next dev` | Start Next.js dev server (port 3000). |
| `build` | `next build` | Production build. |
| `start` | `next start` | Run production server. |
| `worker` | `ts-node --esm src/worker/index.ts` | Run background job worker. |
| `test` | `vitest run` | Run all unit/integration tests once. |
| `test:watch` | `vitest` | Watch mode for TDD. |
| `test:e2e` | `playwright test` | End-to-end smoke tests. |
| `lint` | `eslint . --ext .ts,.tsx --max-warnings 0` | Lint (CI gate). |
| `format` | `prettier --write .` | Format all files. |
| `format:check` | `prettier --check .` | Verify formatting (CI gate). |
| `db:migrate` | `ts-node --esm src/db/migrate.ts` | ✅ Applies `src/db/migrations/*.sql` in filename order (tracked in `schema_migrations`); rollback/recovery guidance in migrate.ts header + §12.4. |

### Docker Compose
- `db` (`ghostcart_db`): PostgreSQL 16-alpine. Mounts `./src/db/migrations` into `/docker-entrypoint-initdb.d/:ro` — Postgres auto-runs `*.sql` files in that directory on first init.
- `redis` (`ghostcart_redis`): Redis 7-alpine with AOF persistence (`--appendonly yes`).
- `app` (`ghostcart_app`): Builds from `./Dockerfile.dev` — **file does not exist yet** (TODO). Mounts project root at `/app` (excluding `node_modules` and `.next` volumes). Depends on db + redis healthchecks.

## 7. Testing Strategy

### Unit / Integration Tests — Vitest
- **Config:** `vitest.config.ts` — jsdom environment, global test globals, setup file `src/__tests__/setup.ts`, v8 coverage provider (text/json/html).
- **Current coverage:** `src/__tests__/health.test.ts` — the only test. Satisfies the Stage 1 "new developer can run tests" gate (Production Blueprint §Stage 1 Test Gate).
- **Planned (Stage 2):** price/margin calculation, access control, validation, adapter mapping, global test DB setup/teardown.

### E2E Tests — Playwright
- **Config:** `playwright.config.ts` — chromium only, `testDir: ./e2e`.
- **Current coverage:** `e2e/smoke.test.ts` — 2 test groups: sign-in page renders (title + accessible landmark) and `/api/health` returns 200 `{"status":"ok"}`.
- **Planned (Stage 2):** expand to full happy path (sign-in → import → review → draft → export) + one failure state.
- In CI: auto-starts `npm run dev` server before running.

## 8. Data Model Summary (`0001_init.sql`)

| Table | Purpose | Key Columns |
|---|---|---|
| `tenants` | Multi-tenant accounts | `id` (UUID PK), `name`, `created_at`, `suspended_at` |
| `users` | Merchant users (next-auth) | `id` (UUID PK), `tenant_id` FK, `email`, `role` (default 'owner'), `created_at` |
| `suppliers` | Approved supplier adapters per tenant | `id`, `tenant_id` FK, `adapter_id` (e.g. 'mock','csv','ebay'), `name`, `config` (JSONB — encrypted in Stage 2+) |
| `products` | Canonical products (normalized) | `id`, `tenant_id` FK, `title`, `description`, `supplier_price_cents`, `currency`, availability, `primary_image_url`, timestamps |
| `product_sources` | Traceability: product↔supplier source | `id`, `product_id` FK, `tenant_id`, `supplier_id` FK, `source_url`, `raw_source_metadata` (JSONB) |
| `listing_drafts` | Editable listing drafts (state machine) | `id`, `tenant_id`, `product_id`, `marketplace`, `state`, `title`, `price`, `attributes`/`shipping` (JSONB), `image_urls` (TEXT[]), `idempotency_key` (UNIQUE), `marketplace_listing_id`, `last_error` |
| `marketplace_connections` | Per-tenant marketplace credentials | `id`, `tenant_id`, `marketplace`, `credentials` (JSONB — encrypted), `connected_at`, `disabled_at` |
| `jobs` | Persistent record of async jobs (mirrors BullMQ) | `id`, `tenant_id`, `type`, `payload` (JSONB), `idempotency_key` (UNIQUE), `status`, `attempts`, `last_error`, timestamps |
| `audit_events` | Immutable audit trail (INSERT-only) | `id`, `tenant_id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at` |

**Note:** RLS policies, `CHECK` constraints on `listing_drafts.state`, and several indexes are marked as TODOs for @agent:archivist.

## 9. Key Design Contracts & Conventions

- **Canonical models** (`src/lib/types/canonical.ts`) — ALL adapters normalize to `CanonicalProduct` / `ListingDraft`. External vendor payloads **must never** leak into the application layer.
- **Adapter interface** (`src/lib/adapters/supplier.interface.ts`) — the app layer depends only on `ISupplierAdapter`. Adapters are swappable via a factory (TODO Stage 2). The mock adapter is isolated in `mock.adapter.ts` — mock logic must never appear in components or routes.
- **Listing state machine:** `draft → ready_for_review → queued → submitted → published → failed` (defined in `canonical.ts`).
- **Job types:** `product.import` (queue: `product.import`), `product.refresh`, `listing.submit` (queue: `listing.submit`).
- **Agent handoff convention:** `// @agent:[name] [actionable task]` comments mark work-in-progress items. These are development scaffolding, not runtime logic.
- **Path alias:** `@/*` maps to `./src/*` (tsconfig + vitest).
- **Idempotency:** API routes are designed around idempotency keys (documented in `products/route.ts` and `listings/route.ts`), though enforcement is a TODO.

## 10. Excluded Files (Not Part of the Application)

These files exist in the repository but are **NOT relevant to the GhostCart application** and should be overlooked by anyone reviewing the codebase for outsourcing, sale, or open-sourcing:

| Path/Pattern | Reason for Exclusion |
|---|---|
| `.cortex/` (and `.cortex/logs/*`) | Agent automation tooling logs (Cortex). Not application code. |
| `.jules/` (`architect.md`, `config.md`, `forge.md`, `scribe.md`, `workflow.md`) | Cline/Jules agent prompt & configuration. Agent instructions — excluded per wiki scope. |
| `.windsurf/rules/project objective alignment.md` | Windsurf agent rule (25 bytes, `trigger: manual`). Agent tooling. |
| `.logs/errors.md`, `.logs/patterns.md` | AOP-CORE shared memory registers (agent memory). Not system error logs or application patterns. |
| `Docs/Agents/` (all `*Prompt.litcoffee`, `*.md` files) | Agent prompt definitions for Atlas, Forge, Scribe, Scout, Dependency Guardian, etc. Pure agent tooling. |
| `dropshipping-websites-master.zip` | Unrelated reference archive. Not project code or config. |
| `French centric drop shipping list.md` | Unrelated reference material. Not project code or config. |
| `phpcs.xml` | PHP CodeSniffer ruleset (WordPress rules). This is a Node/TypeScript project — **not used**. Leftover from early brainstorming that considered a WordPress plugin. |
| `Docs/Jaydr Ghostcart Project Concept.txt` | Original brainstorming concept. Not implementation guidance. |

## 11. Stale / Missing Items & Known Discrepancies

### Build-breaking discrepancies (must fix)
| # | Issue | File(s) | Detail |
|---|---|---|---|
| 1 | **Broken import in products route** | `src/app/api/products/route.ts` (line 4) | ~~Imports `mockProduct` from `@/lib/adapters/mock`…~~ **✅ RESOLVED** — Fixed: `import { mockProduct } from '@/lib/adapters/mock.adapter'`; added `mockProduct` fixture export to `mock.adapter.ts`. |
| 2 | **No NextAuth `[...nextauth]` route handler** | `src/app/api/auth/[...nextauth]/route.ts` (missing) | `next-auth` is a dependency but no API route handler exists. The sign-in page has TODOs to wire `signIn()`. |

### Missing files (required infrastructure)
| # | Missing File | Purpose |
|---|---|---|
| 3 | `Dockerfile.dev` | ~~Referenced by `docker-compose.yml` (line 48) but does not exist.~~ **✅ RESOLVED** — Created (node:20-alpine dev image). |
| 4 | `Dockerfile` | No production Dockerfile for Stage 3+. |
| 5 | `.github/workflows/*.yml` | No CI pipeline (lint, test, typecheck). |
| 6 | `jest.config.*` / `playwright.config.ts` exists | ✅ Playwright config exists; no jest. Vitest covers unit tests. |
| 7 | `e2e/` directory | ✅ Directory exists with `e2e/smoke.test.ts` and additional E2E tests. |
| 8 | `.env` | Not present (intentional — copy from `.env.example`). |
| 9 | `next-env.d.ts` | Auto-generated by Next.js — not committed; expected. |

### Incomplete migration (`0001_init.sql`)
| TODO | Table | Action Needed |
|---|---|---|
| `@agent:archivist` | `tenants` | ✅ RESOLVED — `billing_plan`, `settings` added in 0002_harden.sql |
| `@agent:archivist` | `users` | ✅ RESOLVED — UNIQUE constraint, indexes, `hashed_password`, `last_login` added in 0002_harden.sql |
| `@agent:archivist` | `suppliers` | ⚠️ PENDING — Encrypt `config` column at rest (AES-256 / KMS) |
| `@agent:archivist` | `products` | ✅ RESOLVED — `identifiers`, `additional_image_urls`, `confidence` added in 0002_harden.sql |
| `@agent:archivist` | `listing_drafts` | ✅ RESOLVED — CHECK constraint, index added in 0002_harden.sql |
| `@agent:archivist` | `marketplace_connections` | ✅ RESOLVED — UNIQUE constraint added in 0002_harden.sql |
| `@agent:archivist` | `audit_events` | ✅ RESOLVED — RLS INSERT-only, index added in 0003_rls_seed.sql |
| `@agent:archivist` | All tables | ✅ RESOLVED — RLS policies implemented in 0003_rls_seed.sql |
| `@agent:archivist` | All tables | ✅ RESOLVED — Migration runner implemented (`src/db/migrate.ts`) |

### Stale TODOs in source code
| # | File | TODO | Agent Responsible |
|---|---|---|---|
| 1 | `src/worker/index.ts` | Implement `importProduct` processor logic (adapter factory call, DB persist, audit event) | `@agent:atlas` |
| 2 | `src/lib/queue/index.ts` | Configure job retry options, backoff strategy, TTL; add Bull Board dashboard | `@agent:archivist` |
| 3 | `src/lib/db/index.ts` | Implement migrations runner; add query helper with tenant_id injection | `@agent:archivist` |
| 4 | `src/app/(dashboard)/layout.tsx` | Implement `getServerSession()` check; add `<AppShell>` / `<Sidebar>`; propagate tenantId | `@agent:forge` |
| 5 | `src/lib/types/canonical.ts` | Refine field types as domain model matures | `@agent:archivist` |
| 6 | All `pages.tsx` under `(dashboard)/` | Replace placeholders with real components | `@agent:forge` |

## 12. Critical File Inventory — Root Config & Infrastructure

> This is the definitive catalog of every file critical to GhostCart's operation. Files are grouped by layer. **Production readiness** column indicates whether a file is functional (✅), a stub/scaffold (🟡), or has a known issue (🔴).

### 12.1 Root-Level Configuration

| File | Purpose | Production Readiness |
|---|---|---|
| `package.json` | Project manifest; npm scripts (`dev`, `build`, `start`, `worker`, `test`, `test:e2e`, `lint`, `format`, `db:migrate`) | ✅ (`db:migrate` implemented — see §12.4) |
| `tsconfig.json` | TypeScript compiler config; `@/*` → `./src/*` path alias | ✅ |
| `.eslintrc.json` | ESLint config with Next.js + TypeScript rules; `--max-warnings 0` enforced | ✅ |
| `.prettierrc` | Prettier formatting config; import ordering, single quotes, trailing commas | ✅ |
| `vitest.config.ts` | Vitest unit/integration test config (jsdom, global globals, v8 coverage) | ✅ |
| `playwright.config.ts` | Playwright E2E config (chromium only, auto-starts dev server in CI) | ✅ |
| `docker-compose.yml` | Local dev stack: PostgreSQL 16, Redis 7, Next.js app container | ✅ |
| `.env.example` | Environment variable template (DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, etc.) | ✅ |
| `README.md` | Project overview, quickstart, architecture diagram, AOP-CORE agent pipeline | ✅ |

### 12.2 Infrastructure / DevOps

| File | Purpose | Production Readiness |
|---|---|---|
| `Dockerfile` | (missing — root) Production multi-stage build | 🔴 Missing — referenced for Stage 3+ |
| `Dockerfile.dev` | Development build | ✅ Created (node:20-alpine dev image) |
| CI workflows | `.github/workflows/` (missing) GitHub Actions pipelines | 🔴 Missing |

### 12.3 Database Layer

| File | Purpose | Production Readiness |
|---|---|---|
| `src/db/migrations/0001_init.sql` | Initial schema: 9 core tables | ✅ |
| `src/db/migrations/0002_harden.sql` | Constraints, indexes, canonical product columns, audit guarantees | ✅ |
| `src/db/migrations/0003_rls_seed.sql` | App role, tenant-scoped RLS, dev seed | ✅ |
| `src/db/migrations/0004_user_corrections.sql` | User corrections tracking, idempotency enforcement | ✅ |
| `src/db/migrations/0005_ai_insights.sql` | AI analysis results, cache tables | ✅ |
| `src/db/migrations/0005_import_alpha.sql` | Import alpha features | ✅ |
| `src/db/migrations/0006_ebay_integration.sql` | eBay-specific tables | ✅ |
| `src/db/migrations/0007_job_management.sql` | Enhanced job tracking | ✅ |
| `src/db/migrations/0008_feature_flags.sql` | Feature flag system | ✅ |
| `src/db/migrations/0009_stock_price_refresh.sql` | Stock/price refresh with change detection | ✅ |
| `src/db/migrations/0010_margin_calculation.sql` | Margin calculation system | ✅ |
| `src/db/migrations/0011_repricing_system.sql` | Repricing with guardrails | ✅ |
| `src/db/migrate.ts` | Migration runner; applies 14 migrations in order (0001–0014) | ✅ |
| `src/lib/db/index.ts` | PG pool; RLS helpers; DEV_TENANT_ID; SIGTERM drain | ✅ |

## 12. Critical File Inventory — Application Layers

### 12.4 Types & Canonical Models

| File | Purpose | Production Readiness |
|---|---|---|
| `src/lib/types/canonical.ts` | Canonical domain models: `CanonicalProduct`, `ListingDraft`, `ListingState`, `FieldConfidence`, `JobType`, `JobRecord` | ✅ |
| `src/lib/validation/schemas.ts` | Zod schemas: `ProductListQuerySchema`, `ListingListQuerySchema`, `ProductImportSchema`, `ListingCreateSchema` + inferred types | ✅ |

### 12.5 Adapter Layer

| File | Purpose | Production Readiness |
|---|---|---|
| `src/lib/adapters/supplier.interface.ts` | `ISupplierAdapter` interface — formal contract all adapters must implement | ✅ |
| `src/lib/adapters/mock.adapter.ts` | `MockSupplierAdapter` (implements `ISupplierAdapter`); fixture data for Stage 1; exports `mockAdapter` instance + `mockProduct` fixture for `GET /api/products` | ✅ |
| `src/lib/adapters/factory.ts` | Adapter registry/factory: resolves `ISupplierAdapter` by `adapterId` (`getSupplierAdapter`); ships with `mock` for Stage 1 | ✅ |

✅ **Resolved** (see §11 #1): `src/app/api/products/route.ts` now imports `mockProduct` from `@/lib/adapters/mock.adapter` and the fixture export exists in `mock.adapter.ts`.

### 12.5.1 API Helpers

| File | Purpose | Production Readiness |
|---|---|---|
| `src/lib/api/response.ts` | API response helpers: `apiSuccess`, `apiError` | ✅ |
| `src/lib/api/idempotency.ts` | Idempotency helpers: `checkDuplicateSourceUrl` (DB query with tenant scoping), `generateIdempotencyKey` (SHA-256 hash) — Hybrid duplicate detection (API layer 409 Conflict + DB UNIQUE constraint) | ✅ |

## 13. Known Issues & Technical Debt (Stage 2 Investigation)

The following issues were identified during the Stage 2 investigation (2026-08-09) and documented in [`.logs/errors.md`](.logs/errors.md).

### 13.1 Critical Security Vulnerabilities (ERR-008)

**Severity:** Critical (3 critical, 10 high, 5 moderate, 1 low vulnerabilities)

Current dependency audit identified 19 vulnerabilities:
- **Critical:** Vitest RCE vulnerabilities (GHSA-9crc-q9x8-hgqq, GHSA-5xrq-8626-4rwp)
- **High:** PostCSS XSS/path traversal (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849)
- **High:** Vite path traversal (GHSA-4w7w-66w2-5vf9, GHSA-fx2h-pf6j-xcff)
- **Moderate:** UUID buffer bounds check (GHSA-w5hq-g745-h8pq)

**Remediation:**
```bash
npm audit fix
# Manual updates required for major versions:
npm install vitest@4.1.10 next@14.2.35 bullmq@5.81.3 @playwright/test@1.62.1
```

### 13.2 TODO Debt Accumulation (ERR-009)

**Severity:** Medium

168 TODO markers found across 34 files in src/. Key areas:
- ProductCorrectionForm (6 TODOs)
- CorrectionField (6 TODOs)
- UI components (Button, Input, etc.)
- API routes (health, jobs, products)
- Worker (concurrency tuning)
- Multiple page placeholders

**Impact:** Technical debt accumulation. Unimplemented features may be mistaken for completed work. TODOs in production code create uncertainty about system completeness.

### 13.3 Logging Inconsistencies (ERR-010)

**Severity:** Medium

50+ console.log/error/warn calls across src/. No structured logging framework. Worker uses console.warn for lifecycle events. API routes use console.error without correlation IDs.

**Impact:** Violates Production Blueprint §3.3 requirement for "structured logs, error tracking, health checks, and correlation IDs." Production debugging becomes difficult.

### 13.4 Configuration Security (ERR-011)

**Severity:** Medium

.env.example uses weak default passwords (ghostcart_dev). No explicit warnings about required secure values (NEXTAUTH_SECRET, DEV_SEED_PASSWORD). No secrets rotation process documented.

**Impact:** Development configuration may accidentally be used in production.

### 13.5 Migration TODO Uncertainty (ERR-012)

**Severity:** Low

Migration 0001_init.sql contains TODO comments for RLS policies, billing_plan/settings, UNIQUE constraints, config encryption, identifiers/additional_image_urls/confidence. Some addressed in later migrations but not tracked.

**Impact:** TODO markers in production migrations create uncertainty about schema completeness. Risk of missing security constraints.

### 13.6 Test Coverage Gaps (ERR-013)

**Severity:** Medium

Only 11 test files for 49 TypeScript files and 18 TSX files. No integration tests for worker processes. Many API routes lack test coverage.

**Impact:** Test gate may not catch regressions. Production Blueprint §Stage 1 Test Gate requirements not fully met.

### 13.7 Patterns Discovered

The investigation identified 5 new architectural patterns documented in [`.logs/patterns.md`](.logs/patterns.md):

- **Pattern 10:** TODO Debt Accumulation Pattern
- **Pattern 11:** Console Logging Anti-Pattern
- **Pattern 12:** Dependency Vulnerability Drift
- **Pattern 13:** Migration TODO Uncertainty
- **Pattern 14:** Test Coverage Gap Pattern
- **Pattern 15:** Double Query Anti-Pattern

### 12.6 API Layer

**Total:** 28 route files, 37+ endpoints across 9 functional areas

| Functional Area | Route | HTTP Methods | Purpose | Production Readiness |
|---|---|---|---|---|
| **Health** | `/api/health` | GET | System health check for Docker monitoring and uptime tracking | ✅ |
| **Products** | `/api/products` | GET, POST | List products with pagination, filtering (category, supplierId); initiate import via BullMQ job | ✅ |
| | `/api/products/[id]` | GET | Retrieve single product with tenant isolation | ✅ |
| | `/api/products/[id]/corrections` | PATCH | Apply manual field corrections with audit trail and original value preservation | ✅ |
| | `/api/products/[id]/approve` | POST | Approve product for listing use (review-before-use gate) | ✅ |
| | `/api/products/[id]/refresh` | POST | Enqueue background product refresh job | ✅ |
| | `/api/products/[id]/review-status` | PATCH | Update review status (approved/rejected) with audit logging | ✅ |
| **Listings** | `/api/listings` | GET, POST | List listing drafts with pagination and state filtering; create new draft from product | ✅ |
| | `/api/listings/[id]` | GET, PUT | Retrieve single listing draft; update with partial changes and audit events | ✅ |
| | `/api/listings/calculate-margin` | GET, POST | Calculate margin with full cost breakdown; list fee structures for marketplace | ✅ |
| **Jobs** | `/api/jobs/[id]` | GET | Fetch single background job record for status polling | ✅ |
| | `/api/jobs/[jobId]/retry` | POST | Manually retry a failed job | ✅ |
| | `/api/jobs/activity` | GET | Retrieve activity history (audit_events + jobs) with filtering | ✅ |
| | `/api/jobs/kill` | POST | Kill all queued jobs for tenant (emergency stop) | ✅ |
| **AI Services** | `/api/ai/analyze` | GET, POST | Analyze product for materials, quality, market potential; retrieve cached analysis | ✅ |
| | `/api/ai/rewrite` | GET, POST | Generate AI-assisted listing rewrite with style options; retrieve cached rewrite | ✅ |
| **Auth** | `/api/auth/[...nextauth]` | GET, POST | NextAuth session handler and credentials provider | ✅ |
| **Dashboard** | `/api/dashboard/metrics` | GET | Get dashboard metrics (imports, listings, jobs, margin analysis) | ✅ |
| **eBay** | `/api/ebay/authorize` | GET, POST | Initiate eBay OAuth 2.0 authorization flow; handle OAuth callback | ✅ |
| | `/api/ebay/export/csv` | GET | Export listings to eBay-compatible CSV format | ✅ |
| | `/api/ebay/submit` | POST | Submit listing draft to eBay marketplace | ✅ |
| | `/api/ebay/webhook` | POST | Handle eBay webhook events with signature verification | ✅ |
| **Feedback** | `/api/feedback` | GET, POST | Submit feedback (bug, feature, improvement); list feedback with filtering | ✅ |
| **Admin** | `/api/admin/beta-users` | GET, POST, PATCH | Beta user management: list, invite, update status | ✅ |
| | `/api/admin/feature-flags` | GET, PATCH | Feature flag management: list all, update configuration | ✅ |
| **Repricing** | `/api/repricing/suggest` | GET, POST | Generate repricing suggestion; get pending suggestions | ✅ |
| | `/api/repricing/apply` | POST, PATCH | Apply approved suggestion (with dry-run); approve or reject suggestion | ✅ |
| | `/api/repricing/pause` | GET, POST | Set global or tenant-specific pause state; get current pause state | ✅ |

**Notes:**
- All endpoints currently use DEV_TENANT_ID placeholder (marked with @agent:forge TODO comments for session integration)
- Most endpoints have proper Zod validation, error handling, and audit logging
- Several endpoints have @agent:oracle TODO comments for test coverage

### 12.7 Queue / Worker Layer

| File | Purpose | Production Readiness |
|---|---|---|
| `src/lib/queue/index.ts` | BullMQ config: `importQueue` (`product.import`), `listingQueue` (`listing.submit`); IORedis; retry/backoff | 🟡 (@agent:archivist TODO items pending) |
| `src/worker/index.ts` | Worker entrypoint (`npm run worker`); `product.import` processor resolves adapter via factory, normalizes, persists `products`+`jobs`+`audit_events` (graceful degradation — logs + completes); SIGTERM shutdown | ✅ (Stage 1 import pipeline) |

### 12.8 API Helpers

| File | Purpose | Production Readiness |
|---|---|---|
| `src/lib/api/response.ts` | `apiSuccess()` / `apiError()` helpers; standardized JSON envelope with pagination | ✅ |

### 12.9 UI Components

| File | Purpose | Production Readiness |
|---|---|---|
| `src/components/ui/Button.tsx` | Button component with `variant` and `isLoading` props | 🟡 (stub — design tokens, loading spinner, variants TODO) |
| `src/components/ui/Input.tsx` | Labeled input with error/helper text support | 🟡 (stub — styling TODO) |
| `src/components/ui/EmptyState.tsx` | Empty state for lists with optional CTA | 🟡 (stub — illustration TODO) |
| `src/components/ui/ErrorState.tsx` | Error state with title, message, optional retry | 🟡 (stub — icon, retry styling TODO) |
| `src/components/ui/PageHeader.tsx` | Standard page header with title, subtitle, optional action | 🟡 (stub — breadcrumbs, layout TODO) |
| `src/components/ui/StatusBadge.tsx` | Renders listing state as labeled badge; `STATE_LABELS` map | 🟡 (stub — color tokens, icons TODO) |
| `src/components/import/ProductCorrectionForm.tsx` | Product correction form for manual data edits while preserving original values — Stage 2 scaffold | 🟡 (@agent:forge TODO items pending) |
| `src/components/import/CorrectionField.tsx` | Individual field correction component with original value display, confidence scores, and revert functionality — Stage 2 scaffold | 🟡 (@agent:forge TODO items pending) |

### 12.10 App Router (Pages & Layouts)

> **Route Groups:** `(auth)` wraps sign-in; `(dashboard)` wraps authenticated screens.

| File | Route | Purpose | Production Readiness |
|---|---|---|---|
| `src/app/layout.tsx` | (root) | Root HTML layout; `<html>`, `<body>`; metadata config | 🟡 (AuthSessionProvider TODO) |
| `src/app/page.tsx` | `/` | Root redirect → `/import` | ✅ |
| `src/app/(auth)/sign-in/page.tsx` | `/sign-in` | Sign-in screen scaffold | 🟡 (placeholder — `<SignInForm>` TODO) |
| `src/app/(dashboard)/layout.tsx` | (layout) | Dashboard shell; session validation + nav TODO | 🟡 (placeholder — session check, AppShell TODO) |
| `src/app/(dashboard)/import/page.tsx` | `/import` | Product import form screen (Screen 2 of vertical slice) | 🟡 (placeholder — `<ImportForm>` TODO) |
| `src/app/(dashboard)/products/[id]/review/page.tsx` | `/products/[id]/review` | Product review screen (Screen 3) | 🟡 (placeholder — `<ProductReview>` TODO) |
| `src/app/(dashboard)/listings/[id]/draft/page.tsx` | `/listings/[id]/draft` | Listing draft editor (Screen 4) | 🟡 (placeholder — `<ListingDraft>` TODO) |

### 12.11 Test Infrastructure

| File | Purpose | Production Readiness |
|---|---|---|
| `src/__tests__/setup.ts` | Vitest setup: imports `@testing-library/jest-dom` | 🟡 (global test DB setup/teardown TODO) |
| `src/__tests__/health.test.ts` | Unit test: GET /api/health → 200 + JSON | ✅ |
| `src/__tests__/api/products-idempotency.test.ts` | Idempotency tests: duplicate detection, DB constraint enforcement, tenant isolation — Stage 2 scaffold | 🟡 (@agent:atlas TODO items pending) |
| `src/__tests__/api/products.test.ts` | 4 tests: valid list, invalid query, valid import, invalid URL | ✅ |
| `src/__tests__/api/listings.test.ts` | 4 tests: valid list, invalid state filter, valid draft creation, missing fields | ✅ |
| `src/__tests__/components/ProductCorrectionForm.test.tsx` | Product correction form tests: field editing, save/cancel callbacks, confidence display — Stage 2 scaffold | 🟡 (@agent:forge TODO items pending) |
| `e2e/smoke.test.ts` | Playwright smoke: sign-in page renders + `/api/health` returns 200 | ✅ |

### 12.12 Environment

| Variable | File | Purpose |
|---|---|---|
| `DATABASE_URL` | `.env.example` | PostgreSQL connection string; throws at import in `src/lib/db/index.ts` if unset |
| `REDIS_URL` | `.env.example` | Redis connection string; throws at import in `src/lib/queue/index.ts` if unset |
| `NEXTAUTH_SECRET` | `.env.example` | NextAuth session signing secret; must be generated via `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `.env.example` | NextAuth URL (for production, set to your domain) |
| `DEV_SEED_EMAIL` / `DEV_SEED_PASSWORD` | `.env.example` | Development seed user credentials (Stage 1 only) |
| `DEV_TENANT_ID` | `.env.example` | Tenant fixture ID for Stage 1 |
| `EBAY_APP_ID` etc. | `.env.example` | Marketplace API keys (stubbed — no real credentials until Stage 2+) |

### 12.13 Documentation

| File | Purpose |
|---|---|
| `TECHNICAL_WIKI.md` | This document — technical wiki for code reviewers, outsourcing partners, and future developers |
| `README.md` | Public-facing project overview, architecture, quickstart, AOP-CORE agent pipeline |

---

## 14. Verified Infrastructure & Database Stack (2026-08)

> Findings confirmed by direct inspection of the repository (2026-08). Source of truth for
> DB tooling decisions shared with agents and IDEs.

### Database
- **PostgreSQL 16** (self-hosted or local via Docker Compose) is the source of truth.
- Connection: node-postgres `pg` `Pool` from `DATABASE_URL` (`src/lib/db/index.ts`).
- **No Supabase** - no `supabase/` folder, no `supabase` dependency, no Supabase MCP project wired.
- **No ORM** (no Prisma/Knex/TypeORM) - migrations are hand-written `.sql` files applied by a custom runner: `npm run db:migrate` -> `src/db/migrate.ts`.
- Migrations: `src/db/migrations/0001_init.sql` ... `0015_alerts.sql` (15 total).
- RLS: tenant scoping via `set_config('ghostcart.tenant_id', ..., true)` + `withTenant()` inside a txn.

### Queue / Workers
- Redis 7 + BullMQ (`src/lib/queue/index.ts`, `src/worker/index.ts`) - import + refresh workers, dead-letter queue on final failure.
- Separate worker process: `npm run worker` (`ts-node --esm`).

### Environment / local run
- `docker-compose up -d db redis`, then `npm run db:migrate`.
- Dev defaults (`.env.example`): `postgresql://ghostcart:ghostcart_dev@localhost:5432/ghostcart`, `redis://localhost:6379`.
- **The live stack is RUNNING (2026-08):** `ghostcart_db` (postgres:16-alpine, healthy) + `ghostcart_redis` (redis:7); ports 5432/6379 mapped; `.env` is present and populated. Superuser role is `ghostcart` (not `postgres`).
- **Schema-state caveat:** the live `ghostcart` DB was observed at `schema_migrations` = 3 (only 0001-0003 applied). Run `npm run db:migrate` to sync to 0001-0015 (includes the alerting table).
- **Host client tools:** `psql`/`pg_dump` are NOT installed on the Windows host - run backup/restore scripts where they exist (container/WSL/CI).

### Implications
- Any DB work (backups, restore tests, new tables such as notifications) targets **local Postgres** via `.sql` migrations - the Supabase MCP tooling is NOT in use.
- Stage 4 backup/restore work should use `pg_dump` / `pg_restore` against the `ghostcart` DB (Docker volume `ghostcart_pgdata`).

## 15. Stage 2-5 Verification Log (2026-08)

`tasks/todo.md` was stale (Stages 2-4 implemented but unchecked). Verified against code and synced:

| Stage | Status | Notes |
|---|---|---|
| 2 - Real import | Complete (8/8) | CSV + eBay adapters, normalization, traceability, queue/refresh workers, corrections/review, instrumentation, integration tests |
| 3 - Listing and publish | Complete (9/9) | Drafts, AI rewrite, eBay submit + CSV export, state machine, webhook verification, job activity/retry/kill, contract + E2E tests, beta |
| 4 - Reliability/automation | Complete (8/8) | Refresh, margin, repricing, dashboards, rate limiting, failure-injection, pause verification + ops hardening (backup/restore-test, secrets rotation, alerting via `src/lib/alerts` + `0015`, runbooks) |
| 5 - Expand | Open (0/6) | No second marketplace, roles/invitations, event publication, orders, or analytics yet |

**Stage 4 is now complete.** Stage-4 ops hardening shipped: `scripts/backup-db.sh` / `restore-db.sh` / `restore-test.sh`, `rotate-secrets.sh` / `verify-secret.sh` / `encrypt-env.sh` / `decrypt-env.sh`, alerting (`src/lib/alerts` + migration 0015 + worker DLQ hooks + `/api/alerts`), runbook sections, and a GitHub Actions CI workflow running `db:restore:test`. Notifications (in-app / browser / SMS / Messenger) remain a separate track. **Next: Stage 5** (adapter contract + certification checklist, second marketplace, roles/invitations, etc.).


## 13. Quick Reference: Development Setup

1. **Clone & install:** `git clone` → `cd Jaydr-GhostCart` → `npm install`
2. **Environment:** `cp .env.example .env` → set `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET` (minimum)
3. **Services:** `docker-compose up -d` (start PostgreSQL + Redis)
4. **Dev server:** `npm run dev` (Next.js on http://localhost:3000)
5. **Worker:** `npm run worker` (separate terminal — processes import jobs)
6. **Tests:** `npm test` (Vitest unit), `npm run test:e2e` (Playwright — requires running dev server)
7. **Lint:** `npm run lint` (zero warnings enforced)
8. **Type check:** `npx tsc --noEmit` (strict mode)

> **Note:** Apply the schema with `npm run db:migrate` (runner in `src/db/migrate.ts`). Requires `DATABASE_URL`; applies migrations `0001 → 0014` in order, each in a transaction.

<!-- END_OF_WIKI -->





