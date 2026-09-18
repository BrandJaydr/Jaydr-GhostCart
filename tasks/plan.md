# Triple Pass Protocol: Research-Driven Ingestion Engine, Event Pipeline & Developer Mode Logs

## Current Audit Task — 2026-09-18

### ✅ Audit Findings & Verdict (completed 2026-09-18)

**Method:** Static review + live runtime audit. Docker (`ghostcart_db`/`ghostcart_redis` healthy) + audit app container on `:3100` (compose `:3000` blocked by Joplin — external, not ours). Migration `0021_system_logs.sql` was missing on the live DB and was applied + registered manually. All 45 API routes and 27 test suites inventoried; auth matrix probed unauthenticated; RLS/role inspected via psql.

**Quality gates:** `rules:verify` ✅ · `tsc --noEmit` ✅ 0 errors · **`lint` ❌ 159 errors / 182 warnings** (pre-existing debt; violates the zero-warning gate) · `vitest` **210 passed / 3 flaky** (pass in isolation; ERR-045) · App boots & serves under Docker with DB+Redis ✅.

**Blocking / Critical**
1. ~~none~~ — app boots and serves; no build/type blockers. *(Boot blocker exists only for image-only runs — see ERR-041.)*

**High severity**
2. **SEC-015 (confirmed live):** `/api/admin/beta-users` + `/api/admin/feature-flags` return real admin data and accept POST/PATCH mutations with **zero authentication** (verified 200 + payloads unauthenticated). No global `middleware.ts` exists.
3. **SEC-016 (new):** App DB role is a **superuser with `rolbypassrls=true`** — all RLS tenant-isolation policies are inert for the app connection; isolation relies solely on app-level `WHERE tenant_id` clauses.
4. **SEC-014 (prior pass, still open):** eBay webhook trusts payload `tenantId` (signed) + dev-tenant fallback → cross-tenant write risk.

**Medium severity**
5. **ERR-042:** 11 routes use bare `requireAuth` (throws) without `withAuthRoute` → unauthenticated requests return **500 instead of 401** (verified: `POST /api/ebay/authorize` → 500). These also skip the RBAC permission checks the wrapper pattern provides.
6. **ERR-041:** Docker image alone cannot boot (`getSortedRoutes: 'id' !== 'jobId'` — stale baked `.next`/source); compose works only via bind-mount. Add `.next` to `.dockerignore` + rebuild.
7. **ERR-045:** 3/216 flaky DB-backed tests under parallel run (shared-DB mutation); pass in isolation.
8. **ERR-044:** Host `node_modules/.bin` lacks `tsx` shim → `npm run db:migrate`/`worker` broken on host; `npx tsx` hangs on prompt.

**Low / informational**
9. **ERR-043:** `/api/admin/feature-flags` PATCH reads `params.key` but no `[key]` segment exists → unreachable dead code; flag updates impossible via API.
10. Lint debt (ERR-009/010 lineage) remains the largest gate violation; `rules:verify` console-log warnings unchanged.
11. `docker-compose.yml` `version:` key obsolete (warning only).

**What's healthy (verified):** Session/API-key actor resolution (`resolve-actor`) with fail-closed invalid `gc_` tokens ✅ · `withAuthRoute`+`requirePermission` on core CRUD (products, listings, jobs, suppliers, alerts, dev-logs, feedback, dashboard) all 401 unauthenticated ✅ · eBay webhook HMAC-SHA256 + `timingSafeEqual` + missing-signature 401 ✅ · logger redaction rules ✅ · comprehensive RLS policy catalog (25+ policies) ✅ · `.env` git-ignored ✅ · rate-limit middleware fail-open by design (documented).

**Smallest safe fix path (recommended order):**
1. SEC-015: wrap both admin routes in `withAuthRoute` + owner-only `requireRole` + tenant-scoped/audited queries (smallest diff, biggest risk reduction).
2. ERR-042: convert the 11 bare-`requireAuth` routes to `withAuthRoute` (mechanical).
3. SEC-016: add non-superuser `ghostcart_app` role; use it for app/worker `DATABASE_URL`; keep superuser for migrations.
4. ERR-041: `.dockerignore` `.next` + rebuild image; add boot smoke to CI.
5. ERR-045/ERR-044: serialize DB tests or schema-isolate; `npm ci` on host.

**Registers updated:** SEC-016 → `.logs/vulnerabilities.md`; ERR-041…045 → `.logs/errors.md`; changelog → `tasks/todo.md`.

### ✅ Cycle 1 complete — SEC-015 fixed (2026-09-18)

- Added platform `admin` role to the RBAC matrix in `src/lib/middleware/auth-guard.ts` (full permissions; documented as platform-scoped vs tenant-scoped roles; enrollment DB-only — signup hardcodes `owner`).
- `src/app/api/admin/beta-users/route.ts` + `src/app/api/admin/feature-flags/route.ts`: GET/POST/PATCH wrapped in `withAuthRoute` + `requireRole(actor, 'admin')`; PATCH handlers also carry ERR-043 dead-route notes.
- `dev@ghostcart.local` promoted to `admin` in the dev DB (only enrollment path today).
- Verified: `tsc --noEmit` 0 errors · eslint `--max-warnings 0` on all 3 touched files exit 0 · `auth-guard.test.ts` passing · live probe: both admin endpoints **401** unauthenticated (was 200), `/api/products` still 401, `/api/health` 200.

**Next:** Cycle 2 ✅ COMPLETE 2026-09-18 (ERR-042 + ERR-046 — all 11 bare-`requireAuth` routes wrapped in `withAuthRoute` with least-privilege permissions; repricing/pause tenant-scope fix; gates: `tsc` 0 errors · `eslint --max-warnings 0` clean on all 11 files · `rules:verify` PASSED · vitest `auth-guard`+`products` 36/36 passed · live :3100 all previously-500/tenant-risk endpoints now 401 `UNAUTHORIZED`).

**Next:** Cycle 3 (SEC-016 — restricted app DB role `ghostcart_app`).

### Pass 1: Understanding
- Audit the current application, configuration, API routes, worker, database migrations, UI, and automated tests against the intended import → review → listing → marketplace workflow.
- Determine whether the current checkout builds, type-checks, lints, tests, and starts correctly under the documented Node/Docker runtime.
- Report findings with severity, evidence, impact, and recommended remediation; avoid unrelated edits.

### Pass 2: Verification and Security
- Inspect authentication/session enforcement, tenant propagation, RLS assumptions, input validation, secrets, webhook/API credential handling, logging/redaction, queue idempotency, retry behavior, and external-write safety.
- Compare UI/API contracts and E2E selectors; check migrations for ordering, stale constraints, and production startup behavior.
- Run the repository quality gates and focused tests where dependencies/services permit; record failures without masking environmental blockers.

### Pass 3: Completeness
- Cover happy paths, invalid input, duplicate imports, retries, worker absence, database absence, authorization failures, stale sessions, and marketplace integration failures.
- Classify each issue as blocking, high, medium, low, or informational, and identify the smallest safe fix path.
- Update security/error registers only for new findings or confirmed unresolved concerns; do not delete or rewrite historical entries.

## Pass 1: Understanding
- **Objective:** Integrate external research findings (SpiderFoot, comalex, sudheer-ranga) into GhostCart's backend ingestion and scraper subsystem.
- **Key Enhancements:**
  1. Centralized resilient `HttpClient` with connection pooling, Redis caching, and per-host token bucket throttling.
  2. Multi-tier hybrid product scraper supporting embedded `window.runParams`, JSON-LD, variant matrices, and shipping/landed costs.
  3. Event-driven BullMQ cascading enrichment pipeline with complete data lineage/provenance tracking.
  4. Structured logging engine with Redis stream buffer and PostgreSQL `system_logs` table (tenant-isolated).
  5. Unlockable Developer Mode in Settings (`/settings/general`) and Live Log Console (`/settings/logs`) with real-time SSE streaming, category filtering, search, and JSON inspector.

## Pass 2: Verification & Security Audit
- DB queries and persistent logs enforced via PostgreSQL Row-Level Security (RLS) with `tenant_id`.
- Automatic redaction of sensitive credentials, tokens, and keys in `logger.ts`.
- Redis hot log buffer capped (max 2,000 entries/tenant) and HTTP response size capped to prevent memory exhaustion.
- Developer Mode unlock gate protected by session verification and workspace preferences.

## Pass 3: Completeness & Delivery Matrix
- **Phase 1:** Centralized HTTP Client & Host Throttling (`src/lib/http/`)
- **Phase 2:** Hybrid Ingestion Adapter & Variant/Shipping Engine (`src/lib/adapters/html.adapter.ts`, `src/lib/types/canonical.ts`)
- **Phase 3:** Event-Driven Enrichment Pipeline (`src/lib/queue/`, `src/worker/`)
- **Phase 4:** Telemetry Aggregation, Redis Ring Buffer & PostgreSQL `system_logs` Migration (`0021_system_logs.sql`, `src/lib/logger.ts`, `src/app/api/dev/logs/`)
- **Phase 5:** Unlockable Developer Mode UI & Real-Time Log Console (`src/app/(dashboard)/settings/general/`, `src/app/(dashboard)/settings/logs/`, `src/components/layout/Sidebar.tsx`)
- **Phase 6:** Test Coverage, Documentation Sync (`TECHNICAL_WIKI.md`, `README.md`, `tasks/todo.md`), Quality Gates (`rules:verify`, `lint`, `tsc`).
