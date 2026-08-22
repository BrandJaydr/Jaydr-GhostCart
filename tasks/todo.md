# TODO List - Jaydr GhostCart
# TODO List - Jaydr GhostCart

> **Source of truth for delivery sequencing:** [Production Blueprint and Delivery Guide](../Docs/Production%20Blueprint%20and%20Delivery%20Guide.md)  
> **Thin vertical slice (first release):** A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through **one** approved marketplace path.

---

## Changelog

### 2026-08-22 — Theme Selector: Dynamic Theme Selection Infrastructure

**Category:** Feature Implementation / UX

**Summary:** Integrated `next-themes` and built a client-side theme selection dropdown in the Top Navigation bar, supporting dynamic swapping between "Cream & Burgundy", "Light Mode", and "Dark Mode".

**Changes:**
- `src/app/providers.tsx` — Wrapped `<HeroUIProvider>` inside `<NextThemesProvider>` to manage client-side active theme states and sync with localStorage.
- `src/app/layout.tsx` — Configured `suppressHydrationWarning` and dynamic body styles.
- [NEW] `src/components/ui/ThemeSwitcher.tsx` — Built dropdown selector widget with hydration safety guards.
- `src/components/layout/TopNav.tsx` — Placed the `<ThemeSwitcher />` dropdown inside the top navigation panel.
- Verified TypeScript compilation and rules verification pass successfully.

### 2026-08-22 — Theme Override: Warm Cream and Burgundy 2

**Category:** UI / Styling

**Summary:** Integrated the "Warm Cream and Burgundy 2" color palette configuration as a custom HeroUI theme, standardizing dynamic theme variables and updating the root layout to use the new theme class by default.

**Changes:**
- `tailwind.config.ts` — Defined `"warm-cream-burgundy-2"` (light) and `"warm-cream-burgundy-2-dark"` themes inside `heroui()` plugin configurations. Updated standard Tailwind colors to resolve dynamically using `@heroui/theme` CSS variables via `color-mix`.
- `src/app/globals.css` — Mapped custom CSS variables (`--background`, `--foreground`, `--border`, `--surface`, `--surface-elevated`) under `.warm-cream-burgundy-2` and `.warm-cream-burgundy-2-dark` selectors to align custom Tailwind components with HeroUI primitives.
- `src/app/layout.tsx` — Applied the `warm-cream-burgundy-2` class to the root `<html>` element, enabling the new theme by default.
- Verified compilation and rules check exit with code 0.

### 2026-08-21 — Phase 2 (Sub-Phase B): AI Media Studio

**Category:** Feature Implementation

**Summary:** Restructured the AI Media Studio with a dual-mode tab interface: a user-friendly "Create" tab (image-to-image product mockup generator with drag-and-drop file upload, custom base64 reader, style presets, aspect ratio selectors, and backend generation route) as the primary/default view, and an "Advanced Canvas" tab (relabeling the ComfyUI-style infinite node graph).

**Changes:**
- `src/app/(dashboard)/studio/page.tsx` — Rewrote the studio component to host the two mode tabs under a clean layout styled with Cream & Burgundy tokens. Created a custom drag-and-drop area for image uploading, instructions field, style preset and aspect ratio drop-downs. Wired generation action to `/api/ai/generate-image`.
- [NEW] `src/app/api/ai/generate-image/route.ts` — Implemented image generation API endpoint secured with `withAuthRoute`, returning mock images from a dictionary after a simulated latency delay, providing a clean integration hook for external AI providers.
- Verified TypeScript compilation and rules verification check pass with zero errors.

### 2026-08-21 — Phase 2 (Sub-Phase A): CSV Table Editor

**Category:** Feature Implementation

**Summary:** Implemented the Interactive Product Spreadsheet & CSV Editor with inline click-to-edit cells and Zod validation.

**Changes:**
- `src/app/(dashboard)/products/editor/page.tsx` — Updated validation logic to leverage Zod schemas to ensure price formats and unique SKUs.
- Verified inline cell state management, bulk price adjustment modifier, and mock import to GhostCart.

**Verified:** Form components handle changes properly and validation blocks export when invalid data is present.

### 2026-08-19 — Fix 2: Resolve broken nav targets (ERR-023) + logout (ERR-024)

**Category:** Bug fix / UI / security-correctness

**Summary:** Removed the 404 dead-ends in the sidebar and user menu by adding placeholder routes, and fixed logout to terminate the NextAuth session instead of navigating to a non-existent `/sign-out` page.

**Changes:**
- `src/components/layout/TopNav.tsx` — logout now calls `signOut({ callbackUrl: '/sign-in' })` (was `router.push('/sign-out')`, which 404'd and never ended the session). Also dropped the unused `onSidebarToggle`/`isSidebarCollapsed` binding that failed the lint gate.
- [NEW] `src/app/(dashboard)/jobs/page.tsx` — Jobs stub (EmptyState + "Start an import" → /import).
- [NEW] `src/app/(dashboard)/repricing/page.tsx` — Repricing stub.
- [NEW] `src/app/(dashboard)/profile/page.tsx` — Profile stub (replaces user-menu `/profile` 404).
- [NEW] `src/app/(dashboard)/settings/general/page.tsx`, `settings/marketplaces/page.tsx`, `settings/suppliers/page.tsx` — Settings stubs (replace 3 `/settings/*` 404s).

**Verified:** `npx tsc --noEmit` exit 0. ESLint: none of the 7 changed/new files are flagged. (Project-wide `npm run lint` still surfaces PRE-EXISTING errors in `Prism Working/Template and Samples/*` and ~40 `src/app/api/*` routes — logged in `.logs/errors.md`; tracked as SEC-007 hygiene, out of Fix 2 scope.)

**Open:** `/jobs`, `/repricing`, `/settings/*`, `/profile` are placeholders awaiting their feature builds. `/settings/suppliers` can reuse `GET /api/suppliers` (Fix 1) when the CRUD UI lands (Fix 3c). AppShell has no mobile bottom-nav — separate track.
### 2026-08-19 — Fix 1: Align ImportForm to /api/products contract (ERR-022)

**Category:** Bug fix / UI

**Summary:** Aligned the import form with the current product.import contract so URL imports resolve a valid supplierId and stop 400ing; added the missing supplier lookup endpoint.

**Changes:**
- [NEW] `src/app/api/suppliers/route.ts` — GET /api/suppliers (auth-guarded via `withAuthRoute` + `requirePermission(SETTINGS_READ)`, tenant-scoped with `withTenant`) returning the tenant's supplier connections so the UI can resolve a valid `supplierId` UUID matching the `suppliers` table schema (`id, adapter_id, name, config`).
- `src/components/import/ImportForm.tsx` — posts `{ url, supplierId, idempotencyKey }` (was `{ sourceUrl, adapter }`); generates `idempotencyKey` via `crypto.randomUUID()`; consumes `data.jobId` from the 202 queued response (was `data.id`). Replaced Mock/CSV source cards with a supplier selector (the schema has no `adapter` field; adapters resolve by supplier row), and routed the success path to `/products` instead of `/products/undefined`.
- `src/__tests__/components/ImportForm.test.tsx` [NEW] — asserts the posted body parses with `ProductImportSchema` and that the form reads `data.jobId` (not `data.id`).

**Verified:** `npx tsc --noEmit` exit 0; `eslint --max-warnings 0` on new/changed files exit 0; new test passing.

**Coordinated with:** Stock & Price Sync worker agent — no shared files touched (worker/engine/calculator logging deferred for their tenancy refactor).

**Open:** Mock/CSV source cards remain unrepresented until an `adapter` field is added to `ProductImportSchema`; suppliers CRUD is Fix 3c.


### 2026-08-19 — Stage 5 Phase 2: Deployment Infrastructure & Production Hardening

**Category:** Deployment & Production Hardening

**Summary:** Created multi-stage production Docker and Docker Compose configurations, implemented production environment variable startup validation gates, and expanded route health checks with database/cache connectivity indicators.

**Changes:**
- `Dockerfile.prod` — Created a multi-stage Node 20-alpine Dockerfile configured for non-root execution.
- `docker-compose.prod.yml` — Set up the production compose services separating Next.js and BullMQ worker processes.
- `src/lib/env.ts` — Built a production validation utility protecting against placeholder secrets and dev-only database passwords.
- `src/lib/db/index.ts` — Integrated env validation checks to execute on database pool module load.
- `src/app/api/health/route.ts` — Expanded system checks to query DB and Redis status, returning system uptime and correlation IDs.
- `src/__tests__/health.test.ts` — Hardened assertions to check the `.status` property, maintaining backward compatibility.

**Impact:** Protects production environments from starting up with insecure or dev configurations, provides multi-process Docker isolation, and exposes robust system health analytics.

---

### 2026-08-19 — Stage 4: Stock & Price Sync Background Worker

**Category:** Background Automation & Tenancy Hardening

**Summary:** Implemented transactional, tenant-scoped background workers for automated supplier stock and price synchronization, integrated with the margin calculator and repricing engine.

**Changes:**
- `src/worker/index.ts` — Refactored `persistImport` to accept a `PoolClient` parameter; wrapped `product.refresh` worker execution inside a single `withTenant` transactional client boundary and re-threw errors for retry policies; enqueued stale products staggered by 200ms in `product.sync_scheduler` for active tenants.
- `src/lib/margin/calculator.ts` — Scoped all queries with optional `PoolClient` transaction context.
- `src/lib/repricing/engine.ts` — Scoped repricing suggestion triggers and rules queries with optional `PoolClient` context, validating floor/ceiling prices.
- `src/__tests__/integration/jobs/stock-price-sync.test.ts` — Created integration tests validating price delta history logging, stock drop out-of-stock alerts, repricing pause controls, and DLQ retry-rethrow behaviors using robust SQL-matching mock implementations.

**Impact:** Secures automated inventory synchronization under Row-Level Security, triggers margin warnings and out-of-stock alerts dynamically, and validates repricing suggestions within tenant boundaries.

---

### 2026-08-18 — Stage 4: Price History Tracking & Fluctuation Pattern Analytics

**Category:** Inventory Analytics & Visualization

**Summary:** Implemented statistical price fluctuation analytics, chronological tracking under tenant RLS context, secured API endpoint, and interactive Recharts visualization component with pattern recognition.

**Changes:**
- `src/lib/products/price-history.ts` — Built analytics engine calculating volatility score (0–100), trend classification (`stable`, `rising`, `falling`, `volatile`), min/max/average price bands, net deltas, and automated pattern detection (*rapid surge*, *sharp drop*, *high frequency shifts*, *price erosion*).
- `src/app/api/products/[id]/price-history/route.ts` — Created `GET /api/products/[id]/price-history` route wrapped with `withAuthRoute`, `requirePermission(PRODUCTS_READ)`, and `withTenant` RLS context.
- `src/components/products/PriceHistoryChart.tsx` — Created interactive Recharts line chart styled with brand Burgundy/Cream tokens, KPI summary chips, volatility index, and pattern callout cards.
- `src/__tests__/api/price-history.test.ts` — Added unit and integration tests (5 passing tests).

**Impact:** Gives merchants real-time visual insights into supplier price stability, automatic alerts on sudden cost spikes, and pattern detection for proactive repricing.

---

### 2026-08-17 — Stage 5 Phase 1: Security Gates & API Tenancy Hardening

**Category:** Security & API Hardening

**Summary:** Migrated all high-risk API routes across Products, Listings, and Jobs domains to enforce session-derived tenant isolation, RBAC permission verification, and Row-Level Security (RLS) query context.

**Changes:**
- Wrapped all endpoint handlers with `withAuthRoute` and `requirePermission` (`PRODUCTS_READ`, `PRODUCTS_WRITE`, `LISTINGS_READ`, `LISTINGS_WRITE`, `JOBS_READ`, `JOBS_WRITE`):
  - Products routes: `/api/products` (GET, POST), `/api/products/[id]` (GET), `/api/products/[id]/review-status` (PATCH), `/api/products/[id]/refresh` (POST), `/api/products/[id]/corrections` (PATCH), `/api/products/[id]/approve` (POST).
  - Listings routes: `/api/listings` (GET, POST), `/api/listings/[id]` (GET, PUT), `/api/listings/calculate-margin` (POST, GET).
  - Jobs routes: `/api/jobs/[id]` (GET), `/api/jobs/[id]/retry` (POST), `/api/jobs/kill` (POST), `/api/jobs/activity` (GET).
- Replaced direct un-tenanted database access with the contextual `withTenant(actor.tenantId, cb)` transaction wrapper.
- Updated `checkDuplicateSourceUrl` helper in `src/lib/api/idempotency.ts` to run inside `withTenant`.
- Updated test suites (`products.test.ts`, `products-stage2.test.ts`, `products-idempotency.test.ts`, `listings.test.ts`, `jobs.test.ts`) to mock `resolveActor` and provide contextual `withTenant` client routing.
- Configured `withAuthRoute` in `auth-guard.ts` to make dynamic `context` parameter optional.

**Impact:** Eliminates raw `DEV_TENANT_ID` fallbacks across core business routes, prevents cross-tenant data leaks, enforces granular RBAC permissions, and maintains 100% green test passes across all 161 unit/integration tests.

---

### 2026-08-17 — Stage 3/4 Polish & RLS Hardening

**Category:** Database Security & UX Refinement

**Summary:** Applied migration `0017_alert_events_rls.sql` to enable RLS on `alert_events`, resolved UI tooltip collisions, standardized form inputs, and created form wrapper contract tests.

**Changes:**
- Applied `0017_alert_events_rls.sql` with SELECT, INSERT, and UPDATE policies scoped to `current_setting('ghostcart.tenant_id', true)::uuid`.
- Added RLS tenancy isolation tests for `alert_events` in `src/__tests__/integration/tenancy-isolation.test.ts` with savepoint-wrapped violation queries to prevent connection pool corruption.
- Adjusted sidebar collapsed tooltip offset from 12px to 18px in `Sidebar.tsx` to eliminate layout collisions with page elements.
- Standardized `Input.tsx` to use bordered styling and `text-xs font-semibold` labels.
- Added comprehensive unit tests for `Button` and `Input` form wrapper contracts in `src/__tests__/components/form-wrappers.test.tsx` (10 passing tests).

**Impact:** Complete RLS enforcement on alerts; verified native form prop semantics on UI wrappers; resolved navigation tooltip overlap.

---

### 2026-08-17 - Phase 3 Scaffold (Product Library & Ingestion UI)

**Category:** UI/UX Foundation & Scaffolding

**Summary:** Generated safe structural templates for Phase 3 frontend components with zero hardcoded business logic using the Island Interface Architecture.

**Changes:**
- `SmartLoading` - stage-based progress display component for entity ingestion.
- `ConfidenceIndicator` - visual data confidence badge.
- `ProductCard` - grid card template for product catalog with unboxed floating styling.
- `products/page.tsx` - rebuilt to use a responsive grid of `ProductCard` components, removing all HeroUI Table dependencies.
- Added `SmartLoading.test.tsx` test shell using `@jest/globals`.
- Updated `.jules/forge.md` with visual pipeline loading and Island Interface patterns.

**Impact:** Structural layouts and visual stubs for Stage 3 are set up, compiled cleanly, and passed lint checks.

### 2026-08-16 - UI Alignment Pass (applied updated design rules)

**Category:** UI/UX Foundation

**Summary:** Applied the newly updated design instructions (UI_RECOVERY_BRIEF step 6 + DESIGN_SYSTEMS_ANALYSIS) to the existing Phase 1/2 UI.

**Changes:**
- `TopNav` - refactored the user `DropdownMenu` to the canonical single `onAction` key handler (was per-item `href`), switching icons to `startContent` - per DESIGN_SYSTEMS_ANALYSIS.
- `Sidebar` - active nav item now uses a visual ring (`ring-inset ring-primary-500/30`) with improved dark-mode contrast (`dark:text-primary-300`) instead of flat `bg-primary-50`, per the dark-mode/contrast rule.
- Verified navigation uses pure-CSS hovers and a click-based sidebar toggle (no state-driven hover re-renders) - compliant with UI_RECOVERY_BRIEF step 6.
- Corrected `UI_LIBRARY_MAPPING_TABLE.md` Tailwind version from v4.3.3 to v3.4.19 (doc consistency with the installed baseline).
- Verified `tsc --noEmit` and `eslint --max-warnings 0` both pass on all changed files.

**Impact:** Navigation is now consistent with the canonical HeroUI Dropdown pattern and high-contrast in dark mode; documentation reflects the real Tailwind baseline.

### 2026-08-16 - Frontend Phase 1 & 2: Layout Recovery + Command Center Dashboard

**Category:** UI/UX Foundation

**Summary:** Completed the UI-layout infrastructure recovery (Phase 1) and rebuilt the Phase 2 Command Center dashboard to consume the real `/api/dashboard/metrics` response shape, which fixes a runtime crash where the client previously read fields (e.g. `totalProducts`, `activeListings`) that the API does not return.

**Changes:**
- `tsconfig.json` - excluded `Prism Working` template samples from type-checking so `tsc --noEmit` is clean.
- Removed an unused `@ts-expect-error` directive in `src/lib/auth/config.ts` (TS2578).
- `ToastProvider` - replaced invalid `animate-in slide-in-from-right` classes (they require the uninstalled `tailwindcss-animate` plugin) with a dedicated `gc-toast-in` CSS keyframe added to `globals.css`, keeping reduced-motion behavior.
- Added reusable `src/components/ui/StatCard.tsx` (BOM-free, uses Lucide trend icons) with tone, trend, hint, and loading variants - planned for reuse on Repricing, Performance Analytics, and Research screens.
- Rebuilt `src/app/(dashboard)/dashboard/client.tsx` to mirror the real API shape (`{ imports, listingStates, jobFailures, marginAnalysis }`) and render KPI StatCards, Margin Analysis bands, a Recent Failures feed, and a Listing States table.
- Wired `Breadcrumbs` into the Command Center page.
- Verified `npx tsc --noEmit` exits with zero errors.

**Impact:** The dashboard now renders live operational metrics instead of crashing; the frontend foundation compiles; and the new reusable `StatCard` is available for later phases.

### 2026-08-14 — CLI & Programmatic API Key Authentication

**Category:** CLI & Authentication Infrastructure

**Summary:** Implemented the GhostCart CLI tool (`ghostcart`) and added stateless API key authentication for CLI, third-party automation, and AI Agent access.

**Changes:**
- ✅ Added `api_keys` database schema (migration `0016_api_keys.sql`) with RLS tenant isolation and a global unique email index on users.
- ✅ Upgraded authentication in `config.ts` to be DB-backed rather than env-var based (using timing-safe SHA-256 comparison).
- ✅ Created API key generation and timing-safe verification module (`api-key.ts`) ensuring keys are never stored raw in the database.
- ✅ Implemented unified `resolveActor` middleware (`resolve-actor.ts`) that checks both NextAuth session cookies and Bearer API keys.
- ✅ Added `/api/auth/login` programmatic auth route returning short-lived JWTs for non-browser CLI clients.
- ✅ Added `/api/auth/keys` endpoints for listing, creating, and revoking API keys.
- ✅ Created standalone TypeScript CLI in `/cli/` using ES modules, Commander, Chalk, and Inquirer.
- ✅ Added BBS-style retro ASCII theme (`theme.ts`), custom ASCII table renderer (`table.ts`), and animated braille spinner (`spinner.ts`).
- ✅ Implemented core command groups for `auth`, `products`, `listings`, `jobs`, `account`, and `repricing`.
- ✅ Added `--json` flag on all commands for machine readability (agentic-friendly) and `--web` to redirect commands to the browser.
- ✅ Excluded `/cli/` from the main app's TypeScript compilation in `tsconfig.json` to prevent module resolution conflicts.

**Impact:**
- Users can log in, upload CSV files, approve/reject products, review/submit listings, calculate margins, and view system alerts/jobs natively in the terminal.
- AI agents, automation pipelines (e.g., n8n/Zapier), and CI/CD tools can programmatically access the GhostCart backend via API keys.
- Local development security is improved by migrating credentials from hardcoded env-vars to DB-backed authentication.

---

### 2026-08-12 — UI Foundation Recovery

**Category:** UI/UX Foundation

**Summary:** Fixed critical UI foundation issues that were blocking frontend development, following the UI Recovery Brief specification.

**Changes:**
- ✅ Installed Tailwind CSS v3 and PostCSS configuration (was missing despite Tailwind config existing)
- ✅ Created global CSS with comprehensive design token system (colors, typography, spacing, accessibility)
- ✅ Replaced unsupported HeroUI Layout components with GhostCart-owned semantic HTML + Tailwind shell
- ✅ Fixed AppShell component to use CSS Grid/Flex instead of fictional HeroUI Layout.* API
- ✅ Updated Sidebar component with Lucide React icons (replaced emoji navigation)
- ✅ Updated TopNav component with Lucide React icons and proper HeroUI integration
- ✅ Fixed toast provider by replacing HeroUI Toast with custom accessible implementation
- ✅ Extended Button and Input wrappers with standard form props (type, name, value, form, etc.)
- ✅ Resolved Next.js auth-route export error by moving authOptions to separate lib file
- ✅ Fixed import statements to remove .js extensions that were causing build errors
- ✅ Removed incompatible HeroUI Tailwind plugin from configuration

**Impact:**
- Build now compiles successfully
- UI foundation follows the correct ownership model: GhostCart semantic HTML + Tailwind for structure, HeroUI v2 for verified interactive primitives only
- Design token system is now active and accessible
- Navigation uses professional Lucide icons instead of emoji
- Form components properly support standard HTML form attributes

**Follow-up needed:**
- Pre-existing linting errors (unused variables, any types) remain but are not blocking the UI foundation work
- Need to certify one vertical slice (sign-in → import → review → draft) with real API states

---

## Stage 0 — Product Validation and Operating Constraints

**Goal:** Prove there is a permitted, valuable first workflow before significant implementation.

- [ ] Name one target user persona, one target marketplace, and one approved supplier/import source
- [ ] Write a concise PRD for the thin vertical slice with acceptance criteria
- [ ] Confirm marketplace API availability, sandbox access, rate limits, scopes, webhooks, and listing-policy constraints
- [ ] Define data collection, access, retention, and support/escalation ownership
- [ ] Establish pilot metrics: completion rate, median import-to-draft time, import accuracy, publish failure rate, pilot retention
- [ ] Create low-fidelity wireframes for import, product review, listing draft, and activity/error states
- [ ] Run 5–10 target-user interviews or usability sessions confirming workflow and terminology
- [ ] Time-box design-system evaluation (accessibility, React/TypeScript fit, theming, maintenance, licensing)
- [ ] Document approved-integration path or safe export-only fallback

**Exit evidence:** Signed-off workflow, documented integration path, user validation complete.  
**Do not proceed if:** source/marketplace use is unauthorized, user value unvalidated, or safe test credentials unavailable.

---

## Stage 1 — Foundation and Clickable Workflow

**Goal:** Make the core interaction testable quickly without pretending the system is automated.

### Platform and infrastructure
- [x] Scaffold TypeScript app (React/Next.js web client + server-side API routes or small Node API layer)
- [x] Set up repository conventions, linting, formatting, unit-test runner (Vitest), and E2E (Playwright)
- [x] Add local Docker Compose (app, PostgreSQL, Redis / worker queue dependency)
- [x] Add environment-specific configuration and committed `.env.example` (never commit secrets)
- [x] Implement PostgreSQL schema migrations runner with rollback/recovery procedure (`// @agent:archivist`) — `src/db/migrate.ts` + `0002_harden.sql`, `0003_rls_seed.sql`
- [x] Add health checks, structured logs, error tracking, and correlation IDs

### Security and tenancy (required from day one)
- [x] Implement sign-in for development, roles, tenant-scoped tables, and tenant ID propagation (`// @agent:forge`)
- [x] Add basic database schema for roles and audit log (`src/db/migrations/0001_init.sql`)
- [x] Add request validation and idempotency keys for imports, external submissions, and job handlers (`src/lib/validation/schemas.ts`)

### Domain model (first slice)
- [x] Create core data models and TypeScript types: tenants, users, roles, suppliers, products, product sources, listing drafts, marketplace connections, jobs, audit events (`src/lib/types/index.ts`)

### Frontend (minimal — four screens only)
- [x] Build minimal app shell and screen routes: sign-in, import form, product review, listing draft (`src/app/`)
- [x] Use fixture data and mock adapter behind formal interface (`src/lib/adapters/mock.ts`)
- [x] Implement loading, empty, and error states for screens (`src/components/ui/`)
- [x] Start internal component layer: Button, Input, Select, Dialog, DataTable, StatusBadge, EmptyState, ErrorState, PageHeader

### API and testing
- [x] Define first API contracts and error states (`src/app/api/products/route.ts`, `src/app/api/listings/route.ts`)
- [x] Unit tests: mock adapter mapping, price calculations, health check API (`src/__tests__/`)
- [x] Browser-level smoke test scaffold (`e2e/smoke.spec.ts`)

**Test gate:** New developer can clone, configure, start, and run tests (`npm test`, `npm run dev`); test user completes workflow against fixtures.

---

## Stage 2 — Functional Alpha: Real Product Import

**Goal:** Replace one mock boundary with a real, authorized data source.

- [x] Implement one supplier/catalog adapter (authorized API, feed, or user-provided CSV) — `src/lib/adapters/csv.adapter.ts`
- [x] Build adapter contract interface: `validateConnection`, `importProduct`/`fetchProduct`, normalization to canonical models — `src/lib/adapters/supplier.interface.ts`, `factory.ts`, `normalize.ts`
- [x] Normalize product title, identifiers, images, price, availability, source URL, and timestamp — `src/lib/adapters/normalize.ts`
- [x] Store raw-source metadata for traceability; display confidence/errors to merchant — worker → `product_sources`; `GET /api/products/[id]/review-status`
- [x] Queue imports and refreshes with retryable, idempotent handlers — BullMQ `product.import` + `product.refresh`; `src/worker/index.ts`
- [x] Add manual product correction and review-before-use state — `approve`/`corrections`/`review-status` routes, `ProductCorrectionForm`; `0004_user_corrections.sql`, `0014_review_state.sql`
- [x] Instrument import duration, job failure reason, normalization completeness, duplicate rate — worker + `dashboard` views
- [x] Integration tests against adapter sandbox, recorded fixtures, or contract-test harness — `src/__tests__/integration/csv-adapter-integration.test.ts`, `src/__tests__/api/products-stage2.test.ts`

**Test gate:** Duplicate requests tolerated; transient errors don't create duplicate products; pilot users import bounded test set without developer intervention.

---

## Stage 3 — Functional Beta: Listing Preparation and One Publish Path

**Goal:** Deliver an outcome a merchant can use, with deliberately limited blast radius.

- [x] Add listing templates and editable title, description, attributes, images, price, and shipping fields — `listing_drafts` + `src/app/api/listings/**`, draft page
- [x] Add AI-assisted rewrite as draft-generation only (require user review; preserve original source content) — `POST /api/ai/rewrite`, `src/lib/ai/ai-client.ts`
- [x] Integrate one marketplace sandbox or first release path (CSV/export fallback if direct publishing not approved) — eBay submit + CSV export:`/api/ebay/submit`, `/api/ebay/export/csv`
- [x] Persist listing state transitions: `draft` → `ready_for_review` → `queued` → `submitted` → `published` → `failed` — `listing_drafts.state`; `0006_ebay_integration.sql`
- [x] Verify webhook signatures where available; reconciliation/polling only where permitted — HMAC-SHA256 in `src/lib/adapters/ebay/webhook-handler.ts` + `polling-service.ts`
- [x] Provide activity history, error details, retry controls, and kill switch for submission jobs — `/api/jobs/activity`, `/api/jobs/[id]`, `/api/jobs/[jobId]/retry`, `/api/jobs/kill`
- [x] Contract/integration tests for marketplace payload mapping and expected error responses — `src/__tests__/integration/ebay/listing-mapper.test.ts`
- [x] End-to-end tests: import → export/publish in test environment — `e2e/import-workflow.spec.ts`, `e2e/ebay-submission.spec.ts`, `e2e/ai-rewrite.spec.ts`, `e2e/error-scenarios.spec.ts`
- [x] Run controlled beta with small invited cohort under monitored limits — `/api/admin/beta-users` + feature flags; `0008_feature_flags.sql`

**Test gate:** Every external submission has audit entry, idempotency key, and user-visible result.

---

## Stage 4 — Reliability and Controlled Automation

**Goal:** Make the proven workflow safe to repeat at low volume.

- [x] Add stock/price refresh from the same approved data source — `0009_stock_price_refresh.sql`; `product.refresh` worker; `/api/products/[id]/refresh`
- [x] Build deterministic margin calculations (fees, taxes, shipping, rounding rules) — `src/lib/margin/calculator.ts`, `0010_margin_calculation.sql`, `/api/listings/calculate-margin`
- [x] Add repricing **suggestions** first; automatic repricing only with explicit merchant rules, floors/ceilings, dry-run, previews, alerts, and global pause — `src/lib/repricing/engine.ts`, `0011_repricing_system.sql`, `/api/repricing/suggest|apply|pause`
- [x] Add operational dashboards: import success, listings by state, job failures, suggested margin — `0013_dashboard_views.sql`, `/api/dashboard/metrics`
- [x] Add per-tenant and per-integration rate limiting — `src/lib/rate-limiter.ts`, `src/lib/middleware/rate-limit.ts`, `0012_rate_limiting.sql`
- [x] Establish secrets rotation process, backups/restore tests, alerting, and incident runbooks — `scripts/backup-db.sh`, `scripts/restore-db.sh` (non-interactive via `RESTORE_CONFIRM`), `scripts/restore-test.sh`, `scripts/rotate-secrets.sh` (env names aligned to `.env`), `scripts/verify-secret.sh`, `scripts/encrypt-env.sh`/`decrypt-env.sh` (age); `src/lib/alerts/` + `0015_alerts.sql` + `user.worker` hooks; `.github/workflows/ci.yml`; `Docs/incident-runbooks.md` updated
- [x] Failure-injection tests for job retries and reconciliation — `src/__tests__/integration/failure-injection/worker-failure.test.ts`, `src/__tests__/integration/jobs/retry-policy.test.ts`
- [x] Verify pause action stops queued automation before external side effects — `src/__tests__/integration/pause-verification.test.ts`

**Test gate:** Restore non-production backup successfully; pilot SLOs met for defined observation period.

---

## Stage 5 — Expand Integrations and Team Capabilities

**Goal:** Generalize only patterns that succeeded in the pilot.

- [ ] Build adapter contract and certification checklist before second supplier or marketplace
- [ ] Add second marketplace integration (only after first path is stable)
- [ ] Add roles, invitations, approval policies, and immutable activity history
- [ ] Introduce event publication and additional workers when tested workload requires them
- [ ] Add order-management features as review-first workflows (no automated purchasing until controls mature)
- [ ] Establish analytics model using replicated/aggregated operational data (not transactional DB reporting queries)
- [x] **Security gate before Stage 5 expansion:** add a shared server-side API auth/RBAC guard; replace every `DEV_TENANT_ID` route fallback with the authenticated session tenant; reject production startup when dev credentials or placeholder `NEXTAUTH_SECRET` are configured — verified & implemented
- [x] **Tenant-isolation certification:** run cross-tenant API tests using the least-privilege `ghostcart_app` role and verify every tenant-scoped query executes inside `withTenant()`/RLS context — certified in tenancy-isolation.test.ts
- [x] **Deployment decision and productionization gate (ERR-020):** record an ADR confirming standalone Dockerized Next.js (not WordPress) as the application host; select a container-capable host; add a production Dockerfile and deployment configuration with separate web and BullMQ worker processes, production health checks, secure secrets, backups/restore, and rollback instructions — implemented Dockerfile.prod & docker-compose.prod.yml
- [ ] **Phase 2 Visual Workspaces:** build the AI Media Studio (`/dashboard/studio`) containing the prompt manager and endless node-based ComfyUI-style canvas.
- [x] **Phase 2 CSV Creator:** build the Interactive Product Spreadsheet & CSV Editor (`/dashboard/products/editor`) with inline click-to-edit cells, Zod schema validation, and CSV exporting.
- [ ] **Phase 3 CRM & Chat Module:** design database structures and build paginated chat dashboard with WhatsApp Business Cloud and Telegram Bot API connections.
- [ ] **Phase 4 Multi-Channel Sync:** design integration dev kits for Facebook Catalog API, Etsy API v3, and TikTok Shop Open API.

**Test gate:** Each adapter passes contract, rate-limit, security, and recovery tests; tenant isolation verified across new queries and jobs.

---

## Stage 6 — Scale and Enterprise Options

**Entry criteria:** Sustained measured load, bounded services, defined ownership, security review, reliable pilot operations.

- [ ] Extract independently scaling services when deployment/scaling/ownership requires it
- [ ] Introduce message broker (Kafka/RabbitMQ) with versioned event contracts when durable queue is insufficient
- [ ] Add dedicated analytics infrastructure, advanced reporting, and data-retention controls
- [ ] Evaluate additional marketplace integrations (Amazon SP-API, Etsy, Shopify, Facebook, etc.)
- [ ] Evaluate self-hosting, third-party API access, mobile clients, white-label, and predictive features

---

## First 30-Day Execution Checklist

1. [ ] Select one merchant persona, supplier/input method, and marketplace/export path
2. [ ] Confirm policy, API/sandbox, data-handling, and support constraints
3. [ ] Write acceptance criteria and low-fidelity wireframes for the thin vertical slice
4. [ ] Choose initial stack and component primitives through time-boxed evaluation
5. [ ] Scaffold app, local environment, CI, tests, database migrations, and fixtures
6. [ ] Build authenticated tenant-scoped product import using mock adapter
7. [ ] Build product review and editable listing draft UI with real loading/error states
8. [ ] Replace mock with one authorized import adapter or CSV ingestion
9. [ ] Add safe export or marketplace-sandbox submission path and audit history
10. [ ] Run controlled usability and functional pilot; use evidence to set Stage 4 priorities

---

## Explicitly Deferred (Non-Goals for First Release)

Do not start these until Stages 0–3 are complete and pilot evidence supports expansion:

- Multiple marketplace integrations in parallel
- Kafka/RabbitMQ, microservices, API Gateway, service discovery, Kubernetes
- WordPress admin plugin (standalone Next.js app first)
- Autonomous purchasing, payment handling, or managed buying accounts
- Browser automation without written supplier permission
- CRM, predictive analytics, mobile app, self-hosting, white-label
- Full Frontend UI Component Tree before the first four screens are useful
- Auto-repricing without merchant rules, dry-run, and global pause controls

---

## Ongoing Tasks

- [ ] Monitor system performance and pilot metrics
- [ ] Update marketplace API integrations as vendor APIs change
- [ ] Security audits and credential rotation
- [ ] Documentation and ADR updates (framework, auth, tenant isolation, queue, first integration, design system)
- [ ] Keep [plan.md](./plan.md) aligned with Production Blueprint staging
- [ ] Add correlation/request IDs to API and worker logs; standardize structured error events and redact external webhook payloads before logging
- [ ] Keep local Docker Compose, production topology, and deployment runbooks synchronized; do not describe a dev-only `next dev` container as a production deployment

## Bug Fixes and Maintenance

- [x] **UI recovery gate (ERR-019):** freeze UI-library additions; repair the shell with a custom semantic/Tailwind `AppShell` (not a fictional HeroUI `Layout` API), then make `tsc`, lint, keyboard navigation, and responsive navigation checks pass before starting dashboard work
- [x] Consolidate Prism documentation into one approved implementation brief; mark the WordPress/shadcn UI tree and the contradictory shadcn sections of `DESIGN_PROPOSAL.md` as historical/aspirational — implemented APPROVED_IMPLEMENTATION_BRIEF.md
- [x] Define and test the GhostCart wrapper contracts (`Button`, `Input`, `Toast`) before page adoption; wrappers must expose the native form semantics required by consumers (`type`, `name`, `required`, disabled, and value-change behavior) — verified via `src/__tests__/components/form-wrappers.test.tsx` (10 passing tests)
- [ ] Fix webhook reliability issues (when webhooks are in use)
- [ ] Optimize database queries as data volume grows
- [ ] Improve error handling and user-visible failure recovery
- [ ] Enhance logging, monitoring, and alerting

---

## 📌 Decision Log — Import Pipeline Strategy (2026-08-06)

> **Decision:** Adopted **Option C** — worker + enqueue with graceful degradation.
> Full rationale: see `Jaydr Journal/Jaydr Memo` → "Decision Memo."

**Implemented (Stage 1):**
- [x] `POST /api/products` enqueues a real BullMQ `product.import` job
      (lazily imported queue module, guarded by `process.env.REDIS_URL`, fallback 202)
- [x] Worker resolves adapter via `src/lib/adapters/factory.ts`, calls `importProduct()`,
      persists to Postgres (`products` + `jobs` + `audit_events`), returns `{ productId }`
      (persistence wrapped in try/catch — graceful degradation)
- [x] `mock.adapter.ts` `mockProduct` fixture added; broken route import fixed
- [x] `Dockerfile.dev` created to unblock `docker-compose up`
- [x] `TECHNICAL_WIKI.md` amended (§7.2, §11, §12.5, §12.6, §12.11; `e2e/` marked existing)

**Known limitations (Stage 1 tradeoff):**
- [ ] DB/Redis outages degrade (log + complete) rather than retry — tighten retry
      semantics + dead-letter queue in Stage 2
- [x] `npm run db:migrate` implemented (src/db/migrate.ts) — resolves the TODO-echo limitation (`@agent:archivist`)
- [ ] `0001_init.sql` archivist TODOs (RLS, constraints, indexes, encryption, seeded
      tenant/supplier rows) not yet applied — canonical `identifiers`/`additionalImageUrls`/
      `confidence` fields mapped to `product_sources.raw_source_metadata` in Stage 2

**Feature improvements for consideration:**
- [ ] Add idempotency-key dedup at the route layer (reject duplicate imports)
- [ ] Add job status polling endpoint `GET /api/jobs/[id]`
- [ ] Wire `POST /api/listings/[id]/submit` to `listingQueue` (Stage 3+)

---

## 📋 Proposed Stable Plan — Design & Deployment (OPEN for later deliberation)

> Status: PLAN-REVIEW. Decision-making record, NOT a locked plan. Re-evaluate
> when the time is right (component-library selection, deployment commitment).
> Companion note: `Jaydr Journal/Jaydr Memo` → "Proposed Stable Plan".

**Locked so far:**
- ✅ Styling base: **Tailwind CSS** (approved)
- 🟡 Component library — **OPEN**: shadcn/ui (Radix) vs **Lightswind UI** vs **MeetUI**
- 🟡 Deployment model: Dockerized standalone Next.js mod-monolith
     (app + PostgreSQL + Redis + worker) — **NOT** WordPress / not a plugin (non-goal)
- 🟡 Host — **OPEN**: VPS (DigitalOcean) / Fly.io / Railway / Render (or TBD)
- 🟡 Animation: CSS-first; anime.js deferred until concrete needs

**Logic / why (decision trail):**
- Design-system must be React/Next-native, license-safe, accessible, and map onto
  the existing component primitives (Button, Input, EmptyState, ErrorState,
  PageHeader, StatusBadge) so we strengthen stubs instead of discarding them.
- Worker + durable queue + PostgreSQL favour a container-capable host over a
  serverless-only (Vercel) shape; Vercel = frontend inspiration, not sole hosting
  for this stack.
- WordPress/plugin + microservices/Kafka remain deferred (Stage 3+); see
  TECHNICAL_WIKI §1.3 for the aspirational-vs-current distinction.
- Formal ADRs (`deployment platform`, `design-system foundation`) to be written
  only once the component library and host are chosen.

**Deployment reality check (2026-08-12, ERR-020):** Docker Compose is present only for
local development (`Dockerfile.dev` runs `next dev`; Compose defines `app`, `db`, and
`redis`). There is no WordPress service or plugin code in this repository, no production
Dockerfile, no Compose worker service, and no active remote deployment configuration.
The intended production shape remains a container-capable host running separate web and
worker processes with PostgreSQL and Redis; finalize it through an ADR before a pilot.

---

## 🔐 SECURITY-DEBUG Notation — Security & Debugging Posture (later stages, Stage 4+)

> Label: **SECURITY-DEBUG**. Forward-looking notes for enterprise hardening +
> debugging. **NOT** Stage 1–2 work.

- [ ] **Security Posture Overlay / debug panel** — operator overlay to inspect
      authN/authZ state, tenant isolation (RLS) enforcement, secrets handling,
      audit-trail coverage, rate limiting, security headers/CSP, dependency/CVE status
- [ ] **Webhook event log pages** — inbound/outbound delivery records (see Jaydr Journal note)
- [ ] **General log-view pages** — audit log, application/error log, job/queue history,
      integration/environment status
- [ ] **Debug facilities tied to the overlay** — correlation ids / request tracing,
      RBAC preview, "what would RLS allow?" inspector, feature-flag view
- [ ] **Link to** `@agent:scout` (observability) + a future security-review workstream
- [ ] **Align with** Production Blueprint §7.1 (authorization boundaries,
      backup-restore tests) and `tasks/todo.md` Stage 4 hardening items
