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
