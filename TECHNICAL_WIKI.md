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

---

## 1. Project Overview & Goals

### What It Is
**Jaydr GhostCart** is an enterprise reseller & dropshipping automation platform. It bridges
supplier catalog management with major online marketplaces (eBay, Amazon SP-API, Facebook
Marketplace, Etsy, Shopify). Core capabilities: multi-tenant catalog management,
AI-assisted listing generation/optimization, real-time repricing guardrails, and audit logging.

### Current Implementation Status: Stage 1 — Modular Monolith Scaffold
Per the [Production Blueprint and Delivery Guide](Docs/Production%20Blueprint%20and%20Delivery%20Guide.md),
GhostCart follows a **Modular Monolith** delivery model, not an early microservices rollout.
The current repository is a **Stage 1 scaffold** implementing a single end-to-end "thin
vertical slice":

> A signed-in merchant imports an approved supplier product, reviews normalized data and
> pricing, generates an editable listing draft, and exports or submits that draft through one
> approved marketplace path.

The codebase is intentionally minimal and heavily stubbed (most business logic is
`TODO: @agent:…` placeholders awaiting Stage 2+ implementation).

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
| 1 | Foundation + clickable workflow (**current state**) | Scaffold, Docker Compose, schema, 4 screens, mock adapter, health test |
| 2 | Real supplier import (CSV/sandboxed API) | Stage 0 complete |
| 3 | Marketplace submission + audit history | Stage 2 stable |
| 4 | Scale & enterprise options | Sustained measured load, bounded services |

## 2. Architecture Overview (Current)

```
Browser (React / Next.js, TS)
  │
  ▼
Next.js Web + API Server (src/app/)
  │
  ├─► PostgreSQL  (src/db/migrations/0001_init.sql) — source of truth
  │
  ├─► BullMQ ←→ Redis  (src/lib/queue/index.ts, src/worker/index.ts) — async import pipeline
  │
  └─► Supplier Adapters  (src/lib/adapters/) — normalized via ISupplierAdapter interface
```

**Stack:**
- **Frontend & API:** React 18.3 / Next.js 14.2 (App Router, TypeScript)
- **Database:** PostgreSQL 16 (multi-tenant, tenant_id columns, RLS planned)
- **Queue:** BullMQ backed by Redis 7
- **Background worker:** separate Node process (`npm run worker`) using `ts-node --esm`
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
│   │       └── 📄  0001_init.sql    Initial schema: 8 tables (tenants, users, suppliers, products, …).
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
| `health.test.ts` | Unit test | Stage 1 gate test: asserts `GET()` returns 200 + `{status:'ok'}` + JSON content-type. Imports directly from `@/app/api/health/route`. |

## 5. Environment Configuration (`.env.example`)

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
| `db:migrate` | `echo 'TODO: @agent:archivist'` | **Not implemented yet** — placeholder. The migration runner must be built. |

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
- **Config:** `playwright.config.ts` — chromium only, `testDir: ./e2e` (directory does not yet exist).
- **Planned (Stage 1):** one smoke test covering the sign-in happy path + one failure state.
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

<!-- WIKI_PART_8 -->

