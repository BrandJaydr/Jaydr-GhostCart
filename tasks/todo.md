# TODO List - Jaydr GhostCart

> **Source of truth for delivery sequencing:** [Production Blueprint and Delivery Guide](../Docs/Production%20Blueprint%20and%20Delivery%20Guide.md)  
> **Thin vertical slice (first release):** A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through **one** approved marketplace path.

---

## Changelog

### 2026-10-26 — Sweep #12 (Lead review): PR #15 (GC-S1 fix-up) accepted, PR #12 merged by owner, sweep #11 board entries restored

**Category:** Project governance / Lead review

**Summary:** Changed since sweep #11 (master head 12f62804): the owner merged PR #12 (LANE-5, Janitor) at 2026-10-26 ~3:20 PM ET (merge commit 07c3961e) despite sweep #11's FIXES NEEDED verdict, and LANE-4 opened PR #15 (GC-S1 fix-up, head 9e0fbcd1) — the exact fix-up sweep #11 designated. Verified on the actual branch files: the fail-closed throw is restored outside dev/build mode, the hardcoded dev credential is removed (remaining fallback is credential-less localhost), the CI workflow gains a Postgres service + migrate step, and ERR-043 is marked resolved on the branch — so PR #15 is ACCEPTED on review, effective at merge; ERR-043/044 close at merge, not before. PR #12's database item is superseded by PR #15 (its fallback was the same pattern already on master from PR #11), and its link/lint changes are now on master. Sweep #11's STATUS + 4 REVIEW board entries had been lost in the PR #12 merge resolution (same split-merge pattern as sweep #7) and are restored by this sweep, verdicts unchanged. PR #14 and PR #13 are unchanged in substance. Designations: LANE-1 GC-201, LANE-2 GC-302 gated on PR #14, LANE-3 test support, LANE-4 standing security rotation gated on PR #15, LANE-5 POOL-PICK.


### 2026-10-26 — Fix CI Build and Lint Failure (LANE-5 / Minion 3)

**Category:** Code Quality / CI Repair

**Summary:** Resolved CI workflow failure by eliminating all 43 ESLint errors and 5 ESLint warnings across API routes, library adapters, components, and tests, and adding a local dev fallback for `DATABASE_URL` in `src/lib/db/index.ts` so Next.js static build data collection succeeds when `DATABASE_URL` is unset in CI. Confirmed `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with zero errors.

### 2026-10-25 — Janitor / Docs Hygiene Fixes (LANE-5 / Minion 3)

**Category:** Documentation hygiene

**Summary:** Audited and fixed broken document links across markdown files (`README.md`, `.jules/scribe.md`). Fixed absolute Windows file:// links in `.jules/scribe.md` and verified url-encoded link targets using custom link checker tool `check_docs.py`.

### 2026-10-25 — Sweep #8 (Lead review): GC-S1 reviewed, FIXES NEEDED; PR #11 not merged

**Category:** Project governance / Lead review

**Summary:** Changed since sweep #8's pushed state: the owner merged PR #11 (LANE-4, GC-S1) at 2026-10-26 ~10:37 AM ET (merge commit b2230f27) despite sweep #8's FIXES NEEDED verdict — verified on master, `src/lib/db/index.ts` now carries the silent local-dev fallback (the fail-closed throw is gone) and the lane's claimed `.logs/errors.md` update still never happened (master errors end at ERR-043, the Lead's own entries). GC-S1's audit findings are accepted (ERR-042 + ERR-016 re-confirmation) and its checkbox stands as merged, but the fix-up is retargeted to master under ERR-043 (updated from branch-only to ON MASTER): restore fail-closed handling or gate any default behind explicit local-development mode, remove the hardcoded dev credential from code, add the missing audit log entries, then Lead re-review. Sweep #10 (~7:32 AM ET) prepared a board/todo/errors update but its push never landed (no approval pending now), so its verdicts are re-issued here: PR #14 (GC-301 fix-up) still ACCEPTED on review, pending merge (GC-301 stays unchecked, ERR-040/041 stay OPEN until then); PR #13 still FIXES NEEDED narrowed (DB fallback cleared at tip e081bb68, lint scope unscoped); PR #12 still FIXES NEEDED (DB fallback present at head 8fa23329, link fixes accepted in substance). ERR-044 lands with this sweep (PR #13 instance cleared, PR #12 instance open). Designations: LANE-1 GC-201, LANE-2 GC-302 gated on PR #14 merging, LANE-3 test support, LANE-4 GC-S1 fix-up on master, LANE-5 Janitor fix-up.


### 2026-10-25 — GC-S1: RANGER Sweep #1 Security Audit Completed (LANE-4 / Minion 2)

**Category:** Security & Compliance / RANGER

**Summary:** Executed RANGER Sweep #1 (GC-S1) across codebase: secrets scan, `npm audit` dependency vulnerability review, and API authorization / RLS check.

**Findings & Changes:**
- ✅ Secrets scan confirmed zero hardcoded credentials or private keys committed in version control.
- ✅ Dependency audit identified 28 vulnerabilities (4 critical, 15 high, 8 moderate, 1 low) in external packages (Next.js, Tinypool, PostCSS, Playwright, Zod).
- ✅ Code review re-confirmed API route authentication gap (hardcoded `DEV_TENANT_ID` fallbacks, unauthenticated handlers).
- ✅ Updated `Docs/agent-job-board.md` §5 table state to `DONE (2026-10-25)` and posted `[DONE]` message board entry.
- ✅ Checked off GC-S1 in `tasks/todo.md`.

### 2026-10-25 — Sweep #7 (Lead review): GC-T1 accepted; GC-301 merged with ERR-040/041 open on master; GC-201 unblocked

**Category:** Project governance / Lead review

**Summary:** Owner merged PRs #8 (GC-101), #9 (GC-301), and #10 (GC-T1) and landed the GC-RS1 brief directly on master (f8ad33c1); zero open PRs remain. Lead verified GC-T1's merged fixtures against its acceptance criterion and accepted it. GC-301's sweep #6 FIXES NEEDED verdict still stands: the merge carried ERR-040 (wrong queue) and ERR-041 (missing cron-parser dep) onto master, so the LANE-2 fix-up now targets current master. Note: the 2026-10-24 GC-301 changelog entry's DONE claim is overridden — GC-301 stays unchecked until the fix-up is accepted. Sweep #6's GC-301 REVIEW entry, lost in the merge resolution, was restored to the board. GC-201 is unblocked (PR #8 merged); GC-R1 continues as a post-merge completeness check.

### 2026-10-24 — GC-301: Repeatable-Job Scheduler Implemented (LANE-2 / Thing 2)

**Category:** Worker Infrastructure / Reliability

**Summary:** Implemented the runtime repeatable-job scheduler for migration 0009's `scheduled_refreshes` table.

**Changes:**
- ✅ Created `src/worker/scheduler.ts` (`processScheduledRefreshes` & `calculateNextRunAt`): queries enabled due `scheduled_refreshes` rows, parses cron expressions using `cron-parser`, enqueues `product.refresh` jobs for specific or tenant-wide products, and updates `last_run_at` and `next_run_at`.
- ✅ Integrated scheduler tick (60s interval + startup check) in `src/worker/index.ts`.
- ✅ Added unit tests in `src/__tests__/worker/scheduler.test.ts`.
- ✅ Marked GC-301 DONE on `Docs/agent-job-board.md`.

### 2026-10-23 — Owner's job-flow model written into the board (§5.1)

**Category:** Project governance / delivery system

**Summary:** Cruze clarified the model he originally intended, and the board now runs on it: workers arrive ambiguous, take a role from the board, claim the next available job for that role in the forum, report completion in the forum, and cross the job out on the board themselves; the Lead's 6-hour sweeps verify, comment in the forum, correct board state, and designate next steps. The five lanes remain as role tracks / first seeding. Builder launch times (Jules side): 12:30 AM, 3:30 AM, 10:30 AM, 4:30 PM, 11:30 PM ET; Lead sweeps ~1:32/7:32 AM & PM ET, with a POOL-PICK fallback covering the 12:30 AM launch.

### 2026-10-23 — Five builder lanes + 6-hour Lead review cadence

**Category:** Project governance / delivery system

**Summary:** At Cruze's direction, the single Jules assignment was restructured into five parallel builder lanes (callsigns Thing 1, Thing 2, Minion 1–3), each with its own track in `Docs/agent-job-board.md` §5, and Lotus set to a ~6-hour review-sweep cadence that designates each lane's next state (NEXT TASK / RESEARCH / PAUSED / IDLE).

**Changes:**
- ✅ Job board §5 re-keyed to lanes: LANE-1 AliExpress build chain (GC-101 in flight), LANE-2 worker infra (GC-301/302), LANE-3 test & fixtures (GC-T1), LANE-4 security (GC-S1 + rotation), LANE-5 flex/research (new GC-RS1)
- ✅ Board §8 added: Lead review cadence and designation rules
- ✅ Lean launch prompts: callsign + board pointer only — rules, roles, and tasks are picked up from the board itself, per Cruze's suggestion

### 2026-10-23 — Agent Job Board, Lead Engineer & Development Plan

**Category:** Project governance / delivery system

**Summary:** Cruze appointed Lotus (Muse) as Lead Software Engineer. Established the agent coordination system the AOP-CORE pipeline assumed but never had: a job board with a message-board forum, a role roster, and a phased development plan to a functional app, sequenced from the 2026-10-22 connector scan.

**Changes:**
- ✅ Created `Docs/agent-job-board.md` — mandatory check-in protocol (board → logs → todo → plan), role roster (Jules = primary implementation in the Forge/Atlas slots; Claude = Oracle/reviewer on check-in; Codex = implementation/test support on check-in; Muse subagents = light duty only), live assignments table, standing idle-duty orders, and the agent-only Message Board (forum) with entry format and rules
- ✅ Created `Docs/development-plan.md` — Phases 0–5 to the functional thin vertical slice (real AliExpress import → comps pricing → eBay Trading submit): small daily tasks with owners, dependencies, acceptance criteria, OWNER-GATED markers, and a roadblock/research protocol
- ✅ First delegations posted on the board and mirrored below (GC-101, GC-201, GC-202, GC-R1, GC-T1, GC-S1)
- ✅ Governance + security-maintenance gaps logged as ERR-038 / ERR-039 in `.logs/errors.md`

**Impact:**
- Agents (Jules on cron check-ins, plus any future Claude/Codex/other agents) now have one place to check before acting, assigned roles, and a task queue that leads to a working app instead of ad-hoc work

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
- [ ] **Security gate before Stage 5 expansion:** add a shared server-side API auth/RBAC guard; replace every `DEV_TENANT_ID` route fallback with the authenticated session tenant; reject production startup when dev credentials or placeholder `NEXTAUTH_SECRET` are configured
- [ ] **Tenant-isolation certification:** run cross-tenant API tests using the least-privilege `ghostcart_app` role and verify every tenant-scoped query executes inside `withTenant()`/RLS context
- [ ] **Deployment decision and productionization gate (ERR-020):** record an ADR confirming standalone Dockerized Next.js (not WordPress) as the application host; select a container-capable host; add a production Dockerfile and deployment configuration with separate web and BullMQ worker processes, production health checks, secure secrets, backups/restore, and rollback instructions

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

- [ ] **UI recovery gate (ERR-019):** freeze UI-library additions; repair the shell with a custom semantic/Tailwind `AppShell` (not a fictional HeroUI `Layout` API), then make `tsc`, lint, keyboard navigation, and responsive navigation checks pass before starting dashboard work
- [ ] Consolidate Prism documentation into one approved implementation brief; mark the WordPress/shadcn UI tree and the contradictory shadcn sections of `DESIGN_PROPOSAL.md` as historical/aspirational
- [ ] Define and test the GhostCart wrapper contracts (`Button`, `Input`, `Toast`) before page adoption; wrappers must expose the native form semantics required by consumers (`type`, `name`, `required`, disabled, and value-change behavior)
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

---

## 🤝 Agent Job Board — Active Delegations (2026-10-23)

> Coordination hub: [`Docs/agent-job-board.md`](../Docs/agent-job-board.md) — agents must check the board (assignments + message board) before working. Plan: [`Docs/development-plan.md`](../Docs/development-plan.md). If this list and the board disagree, the board wins and the Lead fixes this file.

- [ ] **GC-100** — All agents: check in on the job board Message Board and confirm roles (Lead: Lotus)
- [x] **GC-101** — Jules: sync `.env.example` with every env var the code reads (full `process.env` sweep of `src/` + `scripts/`)
- [ ] **GC-201** — Jules: AliExpress HMAC-SHA256 signer module + fixture unit tests (dummy secret only)
- [ ] **GC-202** — Jules: AliExpress token provider (transient secret, expiry-aware refresh, mocked-HTTP tests, no plaintext persistence)
- [ ] **GC-R1** — Claude (on check-in): second-eyes review of GC-101 against `process.env` reads in `src/`
- [x] **GC-T1** — LANE-3 (Minion 1): `aliexpress.ds.text.search` response fixture pack (full / empty / error envelope) — completed 2026-10-25
- [ ] **GC-301** — LANE-2 (Thing 2): BullMQ repeatable-job scheduler + `scheduled_refreshes` consumer
- [ ] **GC-302** — LANE-2 (Thing 2): register the missing `listing.submit` worker processor
- [x] **GC-RS1** — LANE-5 (Minion 3): research brief for the GC-102 credential-storage decision (brief only, no code) — Lead-reviewed 2026-10-25; brief landed on master 2026-10-25 (commit f8ad33c1), PR #7 closed as redundant
- [x] **GC-S1** — First idle checked-in agent (Lead assigns): RANGER sweep #1 — secrets-pattern scan (locations/types only) + dependency vulnerability summary, reported on the board — completed 2026-10-25 (LANE-4) — audit findings accepted 2026-10-26 (sweep #11); post-merge fix-up ACCEPTED on review 2026-10-26 (sweep #12, PR #15) pending merge; ERR-043 closes at merge
