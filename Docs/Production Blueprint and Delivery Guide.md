# Jaydr GhostCart: Production Blueprint and Delivery Guide

**Status:** Pre-development guide  
**Audience:** Product owner, technical lead, designers, and implementation teams  
**Purpose:** Turn the current product vision into a sequence of testable, policy-aligned delivery stages.

---

## 1. Product Boundary

GhostCart is intended to help authorized merchants manage product data, prepare marketplace listings, monitor supplier price and stock changes, and review operational performance from one workspace.

The initial product is **not** a full autonomous commerce platform. It must first prove one safe, valuable workflow:

> A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through one approved marketplace path.

This is the **thin vertical slice**. It crosses the user interface, API, database, background job, audit log, and an external integration boundary. It provides more useful evidence than a dashboard with mock data or a collection of unconnected backend services.

### 1.1 Product outcomes

1. Reduce the time required to prepare a compliant listing.
2. Preserve accurate source cost, availability, and listing status.
3. Keep merchant and marketplace credentials isolated and secure.
4. Make automation explainable, reviewable, and reversible.
5. Expand only after measured reliability with a small cohort of authorized users.

### 1.2 Non-goals for the first release

- Multiple marketplace integrations.
- Autonomous purchasing, payment handling, or managed buying accounts.
- Automated evasion of marketplace limits, CAPTCHA challenges, or anti-bot controls.
- Browser automation against suppliers without written permission.
- CRM, predictive analytics, mobile applications, self-hosting, or white-labeling.

These may be evaluated later only after legal, privacy, marketplace-policy, security, and operational reviews.

---

## 2. Delivery Principles

| Principle | Decision |
| --- | --- |
| Build for learning | Ship a small usable flow to a controlled pilot before broad feature work. |
| Prefer a modular monolith | Start with one deployable application with clear modules; extract services only when load, ownership, or deployment independence proves necessary. |
| Use contracts early | Version API payloads, events, and database migrations from the first working feature. |
| Automate conservatively | Price changes, publishing, and fulfillment require guardrails, idempotency, logs, and merchant controls. |
| Secure by default | Tenant isolation, least privilege, secret management, and audit trails are foundational work. |
| Follow approved integrations | Use documented APIs and verified webhooks; obey rate limits, terms, and user authorization. |
| Measure before scaling | Track reliability and user value before adding Kafka, a data warehouse, or additional services. |

---

## 3. Recommended Starting Architecture

### 3.1 First implementation shape

Build one TypeScript application with a React/Next.js web client and server-side API routes or a small Node API layer. Use PostgreSQL as the source of truth. Use a single worker process and a durable queue for asynchronous imports and refreshes. Run the system locally with Docker Compose.

```text
Browser
  |
Web application (React/Next.js)
  |
Application API -- PostgreSQL
  |       |          |
  |       |          +-- tenant-scoped data, audit records, job state
  |       +-- queue --> worker --> approved supplier / marketplace adapter
  |
Authentication, authorization, validation, structured logs
```

This gives the team an end-to-end workflow while preserving future boundaries for `catalog`, `listing`, `pricing`, `marketplace`, and `identity` modules.

### 3.2 Defer the proposed enterprise stack

Kafka/RabbitMQ, separate microservices, a time-series database, a warehouse, service discovery, and Kubernetes are not prerequisites for the first pilot. Their operational overhead will slow validation while there is no real traffic or workload data.

Introduce a dedicated message broker when the existing durable queue cannot meet throughput, delivery, replay, or multi-consumer requirements. Extract a service only when it has a stable contract and needs independent deployment, scaling, security, or team ownership.

### 3.3 Required from day one

- PostgreSQL schema migrations and rollback/recovery procedure.
- Environment-specific configuration and a committed `.env.example`; never commit actual secrets.
- Authentication, tenant ID propagation, role checks, and a basic audit log.
- Request validation, structured logs, error tracking, health checks, and correlation IDs.
- Idempotency keys for imports, external submissions, and all job handlers.
- A local developer environment and automated checks in continuous integration.

---

## 4. Staged Roadmap and Test Gates

Each stage ends with an evidence-based decision: proceed, revise, or stop. Completing documents alone does not satisfy a stage.

### Stage 0: Product validation and operating constraints

**Goal:** Prove there is a permitted, valuable first workflow before significant implementation.

**Work**

- Name one target user, one target marketplace, and one approved supplier/import source.
- Write a concise product requirements document for the thin vertical slice.
- Confirm marketplace API availability, sandbox access, rate limits, scopes, webhook requirements, and listing-policy constraints.
- Define what data is collected, who can access it, retention expectations, and support/escalation ownership.
- Establish product metrics: completion rate, median import-to-draft time, import accuracy, publish failure rate, and pilot retention.
- Create low-fidelity workflow wireframes for import, product review, listing draft, and activity/error state.

**Exit evidence**

- A signed-off workflow and acceptance criteria.
- A documented approved-integration path or a safe export-only fallback.
- Five to ten target-user interviews or usability sessions confirming the workflow and terminology.

**Do not proceed if:** the proposed source or marketplace use is not authorized, the user value is not validated, or the team cannot obtain safe test credentials.

### Stage 1: Foundation and clickable workflow

**Goal:** Make the core interaction testable quickly without pretending the system is automated.

**Work**

- Scaffold the application, repository conventions, linting, formatting, unit-test runner, and CI.
- Add local Docker Compose for the app, PostgreSQL, and the worker/queue dependency.
- Implement sign-in for development, roles, tenant-scoped tables, migrations, and audit events.
- Create a minimal shell and four screens: sign-in, import form, product review, and listing draft.
- Use fixture data and a mock adapter behind a formal interface; never encode mock behavior directly into components.
- Define the first API contracts and error states.

**Test gate**

- A new developer can clone, configure, start, and run the test suite from documented commands.
- A test user can complete the workflow against fixtures.
- Unit tests cover price/margin calculation, access control, validation, and adapter mapping.
- One browser-level smoke test covers the happy path and one failure state.

**Why the UI starts here:** It tests user comprehension, form design, review controls, and terminology early. It is intentionally thin and uses mock data until the backend contract is stable.

### Stage 2: Functional alpha — real product import

**Goal:** Replace one mock boundary with a real, authorized data source.

**Work**

- Implement one supplier or catalog adapter using an authorized API, feed, or user-provided CSV.
- Normalize product title, identifiers, images, price, availability, source URL, and timestamp.
- Store raw-source metadata for traceability and display confidence/errors to the merchant.
- Queue imports and refreshes; make handlers retryable and idempotent.
- Add manual product correction and a review-before-use state.
- Instrument import duration, job failure reason, normalization completeness, and duplicate rate.

**Test gate**

- Integration tests run against an adapter sandbox, recorded fixtures, or a contract-test harness.
- The system tolerates duplicate requests and transient errors without duplicate products.
- Pilot users can import a bounded test set and correct errors without developer intervention.

### Stage 3: Functional beta — listing preparation and one publish path

**Goal:** Deliver an outcome a merchant can use, with a deliberately limited blast radius.

**Work**

- Add listing templates and editable title, description, attributes, images, price, and shipping fields.
- Add an AI-assisted rewrite only as a draft-generation feature; require user review and preserve the original source content.
- Integrate one marketplace sandbox or first release path. If direct publishing is not approved, ship validated CSV/export first.
- Persist listing state transitions: `draft`, `ready_for_review`, `queued`, `submitted`, `published`, `failed`.
- Verify webhook signatures where available and implement reconciliation/polling only where permitted.
- Provide activity history, error details, retry controls, and a kill switch for submission jobs.

**Test gate**

- Contract/integration tests cover marketplace payload mapping and expected error responses.
- End-to-end tests complete import to export/publish in a test environment.
- Every external submission has an audit entry, idempotency key, and user-visible result.
- A small, invited beta cohort completes real tasks under monitored limits.

### Stage 4: Reliability and controlled automation

**Goal:** Make the proven workflow safe to repeat at low volume.

**Work**

- Add stock/price refresh from the same approved data source.
- Build deterministic margin calculations that include configured fees, taxes, shipping, and rounding rules.
- Add repricing suggestions first; automatic repricing requires explicit merchant rules, price floors/ceilings, dry-run mode, change previews, alerts, and an immediate global pause.
- Add dashboards based on operational data: import success, listings by state, job failures, and suggested margin.
- Add rate limiting, secrets rotation process, backups/restore tests, alerting, and incident runbooks.

**Test gate**

- Job retries and reconciliation are verified through failure-injection tests.
- Restore a non-production database backup successfully.
- A pause action stops queued automation before external side effects occur.
- Service objectives for the pilot are met for a defined observation period.

### Stage 5: Expand integrations and team capabilities

**Goal:** Generalize only the patterns that succeeded in the pilot.

**Work**

- Build an adapter contract and certification checklist before a second supplier or marketplace.
- Add roles, invitations, approval policies, and immutable activity history.
- Introduce event publication and additional workers when a tested workload requires them.
- Add order-management features as review-first workflows; do not automate purchasing until security, policy, financial controls, and support processes are mature.
- Establish an analytics model using replicated/aggregated operational data rather than loading reporting queries onto the transactional database.

**Test gate**

- Each adapter passes the same contract, rate-limit, security, and recovery tests.
- Tenant isolation is tested across all newly added queries and jobs.
- Operational dashboards, alert ownership, and support playbooks exist before broader access.

### Stage 6: Scale and enterprise options

**Goal:** Scale from demonstrated demand, not assumptions.

**Possible work after evidence supports it**

- Extract independently scaling services and introduce a message broker with versioned event contracts.
- Add dedicated analytics infrastructure, advanced reporting, and data-retention controls.
- Evaluate self-hosting, API access, mobile clients, white labeling, and predictive features.

**Entry criteria:** sustained measured load, clearly bounded services, defined ownership, a security review, and reliable pilot operations.

---

## 5. UI and Design-System Decision

### 5.1 Should the UI be built first?

**No—not as a standalone priority.** A polished dashboard with fabricated data will not validate imports, marketplace capabilities, data quality, or operational safety. Build UI work **in parallel with the earliest vertical slice**:

1. Stage 0: low-fidelity wireframes and user testing.
2. Stage 1: a minimal functional interface driven by fixtures and API contracts.
3. Stages 2–3: production-quality screens only for workflows backed by real data.
4. Stage 4 onward: expand dashboard, analytics, and secondary navigation after users need them.

The UI matters immediately for usability and workflow validation; visual polish matters after interaction and data contracts are proven. Avoid building the current full component tree before the first four screens are useful.

### 5.2 Should the team search for a design system?

**Yes, but time-box the decision.** Run a short evaluation during Stage 0 or early Stage 1. The team should select an accessible, actively maintained primitive/component foundation compatible with the chosen frontend framework. It should support forms, dialogs, tables, menus, toast messages, focus management, dark/light tokens, and testability.

Recommended approach:

- Adopt a component primitive library rather than inventing accessibility behavior.
- Maintain GhostCart-owned semantic tokens for color, spacing, typography, status, and elevation; do not hard-code vendor palette values throughout pages.
- Build a small internal component layer: `Button`, `Input`, `Select`, `Dialog`, `DataTable`, `StatusBadge`, `EmptyState`, `ErrorState`, and `PageHeader`.
- Use Storybook or an equivalent component preview only after the application scaffold exists and two or more reusable components need documentation.
- Evaluate with a short scorecard: accessibility, keyboard support, React/TypeScript fit, theming, maintenance activity, bundle impact, licensing, and team familiarity.

The existing proposal of shadcn/ui-style composable components with accessible primitives is a reasonable candidate, but it is not a final product design. Establish the brand and semantic tokens after user research—not by copying a generic admin-dashboard template.

### 5.3 Initial design rules

- Design for dense, operational work: clear status, timestamps, source attribution, filtering, and recoverable errors.
- Make automation visible: show why a suggestion exists, what will change, and when it ran.
- Make irreversible actions explicit: confirmation, preview, role check, and audit record.
- Meet accessible interaction basics: keyboard navigation, focus states, sufficient contrast, descriptive labels, and responsive behavior.
- Treat empty, loading, degraded, and failed states as first-class screens.

---

## 6. Data, Integration, and Automation Guardrails

### 6.1 Core records for the first slice

At minimum, model tenants, users, roles, suppliers, products, product sources, listing drafts, marketplace connections, jobs, and audit events. Every tenant-owned table and queued job must include a tenant context. Store timestamps, source attribution, and state transitions explicitly.

### 6.2 Adapter contract

Each supplier/marketplace adapter should expose a narrow, testable interface such as:

- `validateConnection`
- `importProduct` or `fetchProduct`
- `validateListing`
- `submitListing` or `exportListing`
- `refreshListingStatus`

Adapters must convert external data into internal canonical models. The application layer must not depend directly on vendor payload shapes. Record external request IDs and normalized failure categories without logging secrets or unnecessary personal data.

### 6.3 Safety controls

- Use OAuth or scoped API credentials; encrypt stored tokens and rotate/revoke them.
- Validate webhook signatures and replay protection before accepting external events.
- Apply per-tenant and per-integration rate limits.
- Make external writes idempotent and reconcile their final status.
- Default to review-first actions; use explicit opt-in for any automation.
- Keep a global pause/kill switch and a per-integration disable control.
- Perform browser automation only when terms and written authorization allow it; never bypass access controls or anti-bot measures.

---

## 7. Quality Strategy

### 7.1 Test pyramid

| Test type | Use | First examples |
| --- | --- | --- |
| Unit | Fast domain rules | Margin calculations, role checks, state transitions, payload validation. |
| Integration | Database, queue, adapter contracts | Tenant filters, migrations, retry behavior, recorded marketplace responses. |
| End-to-end | Critical user outcomes | Import → review → draft → export/submission; failure and retry path. |
| Security/reliability | Safety properties | Authorization boundaries, webhook validation, failure injection, backup restore. |

### 7.2 Definition of done for a production-facing feature

A feature is complete only when it has acceptance criteria, validation, authorization, tenant coverage, meaningful logs/audit trail, error states, automated tests at the appropriate layer, documentation, and monitoring/rollback expectations. A screen that only renders or an endpoint that only returns a stub is not complete.

### 7.3 Environments

- **Local:** Docker Compose, seeded fixtures, fake integration adapters.
- **Test/CI:** ephemeral or isolated database, migrations, unit/integration/E2E tests.
- **Staging:** sandbox credentials and production-like configuration with no real customer transactions.
- **Production:** least-privilege secrets, backup/restore, monitoring, alerts, and controlled feature access.

---

## 8. Orchestration and Ownership

### 8.1 Initial workstreams

| Workstream | Owns | Earliest stage |
| --- | --- | --- |
| Product and compliance | User research, scope, policies, pilot criteria | 0 |
| Platform | Repo scaffold, CI, environments, secrets, observability | 1 |
| Domain/API | Data model, migrations, authentication, catalog/listing modules | 1 |
| Frontend | Workflow screens, component layer, usability/error states | 0–1 |
| Integration | Adapter contract, sandbox/CSV path, contract tests | 2 |
| Quality and operations | Test strategy, runbooks, support/incident process | 1–4 |

One technical lead should own architectural decisions and interface contracts. Teams should work from small, versioned tickets with explicit dependencies and testable acceptance criteria, not from a broad feature list.

### 8.2 Decision log

Record durable choices as architecture decision records (ADRs), including: chosen application framework, deployment platform, authentication method, tenant-isolation approach, queue, canonical product/listing model, first integration, and design-system foundation. Every ADR should state context, decision, alternatives, consequences, owner, and review date.

---

## 9. First 30-Day Execution Checklist

1. Select one merchant persona, supplier/input method, and marketplace/export path.
2. Confirm policy, API/sandbox, data-handling, and support constraints.
3. Write acceptance criteria and low-fidelity wireframes for the thin vertical slice.
4. Choose the initial stack and component primitives through a time-boxed evaluation.
5. Scaffold the app, local environment, CI, tests, database migrations, and fixtures.
6. Build authenticated tenant-scoped product import using a mock adapter.
7. Build product review and editable listing draft UI, with real loading/error states.
8. Replace the mock with one authorized import adapter or CSV ingestion.
9. Add a safe export or marketplace-sandbox submission path and audit history.
10. Run a controlled usability and functional pilot; use the evidence to set Stage 4 priorities.

---

## 10. Success Criteria for the First Pilot

The first pilot is successful when authorized users can reliably complete the narrow workflow, understand the review states, recover from common failures, and report a meaningful reduction in listing-preparation effort. The team can trace every external action, reproduce failures from logs, and safely disable integrations or jobs.

Only then should GhostCart add marketplace breadth, automatic repricing, order fulfillment, CRM features, or enterprise-scale infrastructure.
