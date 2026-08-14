# Architectural Patterns & System Insights

This file captures recurring design patterns, integration gotchas, database guidelines, and system conventions for Jaydr GhostCart under **AOP-CORE v1.0**.

---

## 🏛️ System Patterns

### 1. Delivery Strategy: Modular Monolith
- **Pattern:** Single deployable application (Next.js client + API + worker queue + PostgreSQL).
- **Rationale:** Avoid prematurely introducing microservice overhead (Kafka, Kubernetes) prior to validating the Stage 1 thin vertical slice.

### 2. Adapter Pattern for Integrations
- **Pattern:** All marketplace and supplier interactions must be isolated behind normalized adapter interfaces (`validateConnection`, `importProduct`, `submitListing`).
- **Rationale:** Prevents external third-party vendor payload shapes from leaking into internal canonical domain models.

### 3. Review-First & Safety Controls
- **Pattern:** Automation features (repricing, posting) require user-review states, explicit merchant opt-in, dry-run capabilities, and global pause switches.
- **Rationale:** Ensures compliance with marketplace terms and prevents unverified automated side-effects.

### 4. Next.js App Router Route Groups for Auth Separation
- **Pattern:** Route group `(auth)/` for unauthenticated screens (sign-in), `(dashboard)/` for authenticated screens. Each group has its own `layout.tsx` — auth guard lives in the dashboard layout.
- **Rationale:** Prevents unauthenticated layout bleeding, eliminates prop-drilling of session state.
- **Discovered by:** Forge 🏗️ — 2026-08-06 Stage 1 scaffold

### 5. 501 Stub Pattern for Unimplemented API Routes
- **Pattern:** All unimplemented API routes return `{ error: 'Not implemented' }` with HTTP 501. Each stub includes a `@agent:atlas` handoff comment referencing the contract spec.
- **Rationale:** Prevents silent no-ops in integration tests and clearly signals pending work without blocking scaffold progress.
- **Discovered by:** Forge 🏗️ — 2026-08-06 Stage 1 scaffold

### 6. BullMQ Queue Naming: `[entity].[action]`
- **Pattern:** BullMQ queue names follow `entity.action` format (e.g. `product.import`, `listing.submit`). Worker processor files mirror the queue name.
- **Rationale:** Consistent naming enables discoverability, monitoring dashboards, and future Bull Board integration.
- **Discovered by:** Forge 🏗️ — 2026-08-06 Stage 1 scaffold

### 7. Worker Graceful Degradation (async pipeline)
- **Pattern:** Background worker processors wrap DB/queue persistence in `try/catch` and still return the normalized result (with a `persisted` flag) rather than re-throwing on transient infra failure. API routes that enqueue lazy-import the queue module guarded by `process.env.REDIS_URL` so unit tests pass without Redis/Postgres running.
- **Rationale:** Avoids a BullMQ retry-storm that could duplicate imports when Postgres/Redis is momentarily unavailable; keeps the Stage 1 test gate ("new developer can run tests") green without a full stack. Persistence failures are logged + audited (never silently dropped) — the normalized `CanonicalProduct` is preserved in the job result.
- **Trade-off:** persistence failures are logged/audited rather than auto-retried. Stage 2 should add retry-on-transient-error with exponential backoff + a dead-letter queue.
- **Discovered by:** Atlas 🗺️ — 2026-08-06 (`product.import` worker; see Decision Memo in `Jaydr Journal/Jaydr Memo` and `tasks/todo.md`)

### 8. Additive SQL Migrations + Schema Migrations Table
- **Pattern:** `.sql` migrations live in `src/db/migrations/NNNN_*.sql` (zero-padded order); `npm run db:migrate` (src/db/migrate.ts) applies un-applied files inside transactions and records each in a `schema_migrations` table. Migrations are **additive** (new files like `0002_harden.sql`, `0003_rls_seed.sql`) rather than mutating earlier ones.
- **Rationale:** Idempotent, replayable schema evolution; a failure mid-migration rolls back the whole file; real environments replay cleanly.
- **Discovered by:** Archivist 🗄️ — 2026-08-06

### 9. Tenant Isolation via RLS + Session GUC
- **Pattern:** Every tenant-scoped table enables row-level security with policies that filter/check on `tenant_id = current_setting('ghostcart.tenant_id', true)::uuid`. A least-privilege `ghostcart_app` role is used, and the app sets the tenant GUC per transaction (`setTenantContextOn`) before querying. `audit_events` is INSERT-only.
- **Rationale:** "Secure by default" (Blueprint §2/§6.1) — if the GUC is unset the policy is NULL → deny (fail-closed), preventing cross-tenant leakage and tenant bleed across pooled connections.
- **Discovered by:** Archivist 🗄️ — 2026-08-06 (migration `0003_rls_seed.sql`)

### 10. TODO Debt Accumulation Pattern
- **Pattern:** Scaffold TODOs (@agent:forge, @agent:atlas handoffs) accumulate across stages without systematic triage. 168 TODO markers found across 34 files in src/ during Stage 2 investigation.
- **Rationale:** Stage 1 scaffold policy allowed stub implementations with TODO markers, but no systematic cleanup process exists. Technical debt accumulates in critical paths (forms, UI components, API routes, worker).
- **Risk:** Unimplemented features may be mistaken for completed work. TODOs in production code create uncertainty about system completeness.
- **Discovered by:** Investigator 🕵️ — 2026-08-09 (ERR-009)

### 11. Console Logging Anti-Pattern
- **Pattern:** Inconsistent logging across codebase using console.log/error/warn instead of structured logging. 50+ console calls found in src/. No correlation IDs, no structured metadata, no log levels.
- **Rationale:** No centralized logging solution implemented. Makes debugging and monitoring difficult in production. Violates Production Blueprint §3.3 requirement for "structured logs, error tracking, health checks, and correlation IDs."
- **Risk:** Production debugging becomes difficult. No ability to correlate requests across services. Security events may be missed.
- **Discovered by:** Investigator 🕵️ — 2026-08-09 (ERR-010)

### 12. Dependency Vulnerability Drift
- **Pattern:** Security vulnerabilities accumulate in dependencies without regular updates. npm audit found 19 vulnerabilities (3 critical, 10 high, 5 moderate, 1 low) during Stage 2.
- **Rationale:** No automated dependency update process. Critical vulnerabilities in Vitest (RCE), PostCSS (XSS/path traversal), Vite (path traversal) remain unpatched.
- **Risk:** Remote code execution, information disclosure, path traversal attacks possible in development environment.
- **Discovered by:** Investigator 🕵️ — 2026-08-09 (ERR-008)

### 13. Migration TODO Uncertainty
- **Pattern:** TODO markers in database migrations create uncertainty about schema completeness. Migration 0001_init.sql contains TODOs for RLS, encryption, constraints that were partially addressed in later migrations but not tracked.
- **Rationale:** No systematic audit of migration TODOs. Some completed in later migrations without removing original TODO comments.
- **Risk:** Missing security constraints may go unnoticed. Schema documentation becomes unreliable.
- **Discovered by:** Investigator 🕵️ — 2026-08-09 (ERR-012)

### 14. Test Coverage Gap Pattern
- **Pattern:** Test coverage lags behind feature development. 11 test files for 49 TypeScript files and 18 TSX files. No integration tests for worker processes. Many API routes lack coverage.
- **Rationale:** Stage 1-2 focused on feature delivery over test coverage. No systematic test coverage requirements enforced.
- **Risk:** Regressions may not be caught. Production Blueprint §Stage 1 Test Gate requirements not fully met.
- **Discovered by:** Investigator 🕵️ — 2026-08-09 (ERR-013)

### 15. Double Query Anti-Pattern
- **Pattern:** Database queries that fetch data and count/related information are executed as separate round trips instead of combined CTEs. Found in products route (GET /api/products) and usage-limits.ts (checkUsageLimit).
- **Rationale:** Developers write sequential queries for readability without considering performance impact of multiple DB round trips.
- **Risk:** Unnecessary network latency (2x DB calls), increased connection pool pressure, slower API response times, especially under load.
- **Solution:** Combine separate queries into single PostgreSQL Common Table Expression (CTE) to reduce round trips from 2 to 1.
- **Discovered by:** Bolt ⚡ — 2026-08-09 (ERR-014)

### 16. Page-Only Authentication Pattern
- **Pattern:** The dashboard layout calls `getServerSession`, but API handlers generally use `DEV_TENANT_ID` and do not call a shared session/RBAC guard.
- **Risk:** Direct API callers can reach operational/admin behavior without the same authorization boundary as the UI; caller-supplied tenant/user IDs in admin routes amplify the risk.
- **Required control:** Resolve user, tenant, and role once per request on the server; fail closed outside development; execute tenant-scoped work inside the RLS transaction wrapper.
- **Discovered by:** Senior Architect + RANGER — 2026-08-12 (ERR-016)

### 17. Uncorrelated Error Logging Pattern
- **Pattern:** Raw `console.log/error/warn` calls remain across API routes, workers, and libraries, with inconsistent error shapes and no request/job correlation ID. Webhook code also logs complete payloads.
- **Risk:** Repeated failures cannot be traced across HTTP → queue → worker boundaries, and payload logging can leak merchant/order data.
- **Required control:** Add one structured logging boundary, propagate correlation IDs, classify retryable errors, and redact payloads before emission.
- **Discovered by:** Investigator — 2026-08-12 (ERR-017)

### 18. Environment-Dependent Verification Pattern
- **Pattern:** The repository documents a local test gate, but the configured Vitest runner currently fails during startup under the active sandbox before collecting tests.
- **Risk:** CI/local verification can be falsely reported as complete when only a toolchain startup error was observed.
- **Required control:** Keep a recorded test command/result matrix and verify the runner loads before interpreting pass/fail counts.
- **Discovered by:** Investigator — 2026-08-12 (ERR-018)
