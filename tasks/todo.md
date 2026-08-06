# TODO List - Jaydr GhostCart

> **Source of truth for delivery sequencing:** [Production Blueprint and Delivery Guide](../Docs/Production%20Blueprint%20and%20Delivery%20Guide.md)  
> **Thin vertical slice (first release):** A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through **one** approved marketplace path.

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
- [ ] Implement PostgreSQL schema migrations runner with rollback/recovery procedure (`// @agent:archivist`)
- [x] Add health checks, structured logs, error tracking, and correlation IDs

### Security and tenancy (required from day one)
- [ ] Implement sign-in for development, roles, tenant-scoped tables, and tenant ID propagation (`// @agent:forge`)
- [x] Add basic database schema for roles and audit log (`src/db/migrations/0001_init.sql`)
- [ ] Add request validation and idempotency keys for imports, external submissions, and job handlers (`// @agent:atlas`)

### Domain model (first slice)
- [x] Create core data models and TypeScript types: tenants, users, roles, suppliers, products, product sources, listing drafts, marketplace connections, jobs, audit events (`src/lib/types/index.ts`)

### Frontend (minimal — four screens only)
- [x] Build minimal app shell and screen routes: sign-in, import form, product review, listing draft (`src/app/`)
- [x] Use fixture data and mock adapter behind formal interface (`src/lib/adapters/mock.ts`)
- [x] Implement loading, empty, and error states for screens (`src/components/ui/`)
- [x] Start internal component layer: Button, Input, Select, Dialog, DataTable, StatusBadge, EmptyState, ErrorState, PageHeader

### API and testing
- [ ] Define first API contracts and error states (`// @agent:atlas`)
- [x] Unit tests: mock adapter mapping, price calculations, health check API (`src/__tests__/`)
- [x] Browser-level smoke test scaffold (`e2e/smoke.spec.ts`)

**Test gate:** New developer can clone, configure, start, and run tests (`npm test`, `npm run dev`); test user completes workflow against fixtures.

---

## Stage 2 — Functional Alpha: Real Product Import

**Goal:** Replace one mock boundary with a real, authorized data source.

- [ ] Implement one supplier/catalog adapter (authorized API, feed, or user-provided CSV)
- [ ] Build adapter contract interface: `validateConnection`, `importProduct`/`fetchProduct`, normalization to canonical models
- [ ] Normalize product title, identifiers, images, price, availability, source URL, and timestamp
- [ ] Store raw-source metadata for traceability; display confidence/errors to merchant
- [ ] Queue imports and refreshes with retryable, idempotent handlers
- [ ] Add manual product correction and review-before-use state
- [ ] Instrument import duration, job failure reason, normalization completeness, duplicate rate
- [ ] Integration tests against adapter sandbox, recorded fixtures, or contract-test harness

**Test gate:** Duplicate requests tolerated; transient errors don't create duplicate products; pilot users import bounded test set without developer intervention.

---

## Stage 3 — Functional Beta: Listing Preparation and One Publish Path

**Goal:** Deliver an outcome a merchant can use, with deliberately limited blast radius.

- [ ] Add listing templates and editable title, description, attributes, images, price, and shipping fields
- [ ] Add AI-assisted rewrite as draft-generation only (require user review; preserve original source content)
- [ ] Integrate one marketplace sandbox or first release path (CSV/export fallback if direct publishing not approved)
- [ ] Persist listing state transitions: `draft` → `ready_for_review` → `queued` → `submitted` → `published` → `failed`
- [ ] Verify webhook signatures where available; reconciliation/polling only where permitted
- [ ] Provide activity history, error details, retry controls, and kill switch for submission jobs
- [ ] Contract/integration tests for marketplace payload mapping and expected error responses
- [ ] End-to-end tests: import → export/publish in test environment
- [ ] Run controlled beta with small invited cohort under monitored limits

**Test gate:** Every external submission has audit entry, idempotency key, and user-visible result.

---

## Stage 4 — Reliability and Controlled Automation

**Goal:** Make the proven workflow safe to repeat at low volume.

- [ ] Add stock/price refresh from the same approved data source
- [ ] Build deterministic margin calculations (fees, taxes, shipping, rounding rules)
- [ ] Add repricing **suggestions** first; automatic repricing only with explicit merchant rules, floors/ceilings, dry-run, previews, alerts, and global pause
- [ ] Add operational dashboards: import success, listings by state, job failures, suggested margin
- [ ] Add per-tenant and per-integration rate limiting
- [ ] Establish secrets rotation process, backups/restore tests, alerting, and incident runbooks
- [ ] Failure-injection tests for job retries and reconciliation
- [ ] Verify pause action stops queued automation before external side effects

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

## Bug Fixes and Maintenance

- [ ] Fix webhook reliability issues (when webhooks are in use)
- [ ] Optimize database queries as data volume grows
- [ ] Improve error handling and user-visible failure recovery
- [ ] Enhance logging, monitoring, and alerting
