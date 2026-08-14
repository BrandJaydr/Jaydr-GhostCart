# Jaydr GhostCart 🛒⚡

**Enterprise Reseller & Dropshipping Automation Platform**

> **Frontend compatibility notice (verified 2026-08-12):** This repository runs **Next.js 14.2.5, React 18.3.1, and HeroUI v2.8.10**. Tailwind v3 is the intended configuration (`tailwind.config.ts`), but `tailwindcss` is not currently declared in `package.json`/the root lockfile; do not assume an active Tailwind runtime until the UI recovery gate resolves that dependency. See [UI Recovery Brief](Prism%20Working/UI_RECOVERY_BRIEF.md).

Jaydr GhostCart is a high-performance e-commerce management platform designed for resellers, dropshippers, and multi-channel e-commerce brands. It streamlines product importing, data normalization, AI-assisted listing generation, pricing monitoring, and multi-marketplace listing workflows.

---

## 🎯 Product Vision & Enterprise Scope

GhostCart bridges supplier catalog management with major online marketplaces:
- **Supported Marketplaces (Roadmap):** eBay, Amazon (SP-API), Facebook Marketplace, Etsy, Shopify.
- **Supplier Integration:** CSV/Feed Ingestion, Supplier APIs, and custom browser automation adapters.
- **Core Capabilities:** Multi-tenant catalog management, AI listing generation/optimization, real-time repricing guardrails, and audit logging.

---

## 🚀 Delivery Strategy: Thin Vertical Slice

To ensure reliability, security, and policy compliance, GhostCart follows a **Modular Monolith** delivery model outlined in the [Production Blueprint & Delivery Guide](Docs/Production%20Blueprint%20and%20Delivery%20Guide.md).

**Current Status: Stages 2–4 verified complete; Stage 5 open**

Stages 2–4 are implemented and were verified against the code (2026-08); `tasks/todo.md` was synced to match (it was previously stale). This includes real supplier import pipelines (CSV, eBay), enhanced database features (14 migrations, 0001–0014), and enterprise-grade capabilities including:
- Real supplier adapter implementations (CSV, eBay)
- Stock/price refresh system with change detection
- Margin calculation and repricing systems
- AI-powered listing analysis and optimization
- Enhanced RLS policies and audit trails

The Stage 1 thin vertical slice remains the foundation:
> *A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through one approved marketplace path.*

---

## 🔒 Security & Known Issues

**⚠️ Critical Dependency Vulnerabilities (ERR-008)**

Current dependency audit identified 19 vulnerabilities (3 critical, 10 high, 5 moderate, 1 low):
- **Critical:** Vitest RCE vulnerabilities (GHSA-9crc-q9x8-hgqq, GHSA-5xrq-8626-4rwp)
- **High:** PostCSS XSS/path traversal (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849)
- **High:** Vite path traversal (GHSA-4w7w-66w2-5vf9, GHSA-fx2h-pf6j-xcff)
- **Moderate:** UUID buffer bounds check (GHSA-w5hq-g745-h8pq)

**Remediation Steps:**
```bash
npm audit fix
# Manual updates required for major versions:
npm install vitest@4.1.10 next@14.2.35 bullmq@5.81.3 @playwright/test@1.62.1
```

**Configuration Security (ERR-011)**
- `.env.example` uses weak default passwords (ghostcart_dev)
- NEXTAUTH_SECRET must be replaced with secure random value before production
- No secrets rotation process currently documented

**Technical Debt (ERR-009)**
- 168 TODO markers across 34 files in src/
- Key areas: ProductCorrectionForm, CorrectionField, UI components, API routes
- Systematic triage process needed for Stage 3

See [`.logs/errors.md`](.logs/errors.md) for complete investigation findings.

---

## 🏗️ Architecture & Tech Stack

GhostCart is structured as a modular monolith in TypeScript:

```text
Browser Client (React / Next.js)
        │
        ▼
Next.js Web & API Server ───► PostgreSQL (Source of Truth, Row-Level Security)
        │                          │
        ├─► Local Durable Queue ───┴─► Background Worker Processes
        │                          │
        ├─► AI Analysis Services ───┴─► Cache Manager
        │
        └─► Marketplace / Supplier Adapters (Normalized Canonical Contracts)
```

- **Frontend & API:** React / Next.js (TypeScript)
- **Database:** PostgreSQL (Multi-tenant, audit records, job state, 14 migrations)
- **Asynchronous Tasks:** Durable job queue with worker process (import + refresh workers)
- **AI Services:** Ollama/VLLM integration for listing optimization
- **Containerization:** Docker & Docker Compose

---

## 🛠️ Quickstart / Local Development

### Prerequisites
- Node.js (v20+)
- Docker & Docker Compose
- Git

### Getting Started

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/BrandJaydr/Jaydr-GhostCart.git
   cd Jaydr-GhostCart
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start Local Services:**
   ```bash
   docker-compose up -d
   ```

4. **Security Check (Recommended):**
   ```bash
   npm audit
   # Fix critical vulnerabilities before proceeding
   npm audit fix
   ```

5. **Install Dependencies & Run Dev Server:**
   ```bash
   npm install
   npm run dev
   ```

### Ops Tooling (Stage 4)

```bash
npm run db:backup            # pg_dump -> ./backups/*.sql.gz (+ checksum) with retention
RESTORE_CONFIRM=yes npm run db:restore -- <backup.sql.gz>   # restore (non-interactive)
npm run db:restore:test      # backup -> restore to scratch DB -> smoke checks (Stage 4 gate)
npm run secrets:verify       # non-destructive secret health check
npm run secrets:rotate       # back up + regenerate secrets in .env
./scripts/encrypt-env.sh     # age-encrypt .env -> .env.age (at-rest)
./scripts/decrypt-env.sh     # decrypt .env.age -> .env
```

---

## 🔁 CI/CD & Automated Workflows

GhostCart utilizes GitHub Actions for continuous integration, regression testing, and security scanning:

1. **Continuous Integration ([`ci.yml`](file:///.github/workflows/ci.yml))**
   - **Triggers:** Push to `main`/`Curser-Branch`, Pull Requests.
   - **Checks:** ESLint lint checks, TypeScript typechecking (`tsc`), Production build compilation, Vitest unit tests, and Database migrations + non-interactive database restore smoke checks (`db:restore:test`) against a live Postgres test service.

2. **Security Scan ([`security.yml`](file:///.github/workflows/security.yml))**
   - **Triggers:** Push to `main`/`Curser-Branch`, Pull Requests, and weekly cron schedules (Sunday at 00:00 UTC).
   - **Checks:**
     - **Secret Leak Detection:** Scans full commit history using `TruffleHog` to catch exposed API keys, db passwords, and credentials.
     - **Dependency Vulnerabilities:** Runs `npm audit` and blocks pull requests if dependencies contain `high` or `critical` severity CVEs.
     - **Static Application Security Testing (SAST):** CodeQL scanning of Javascript/Typescript files for common security flaws (XSS, path traversal, injection).


---

## 🧠 AOP-CORE Agent Pipeline & Governance

Jaydr GhostCart is built and maintained following **AOP-CORE v1.0** (Agent Orchestration & Pipeline Core).

### Shared Memory Registers
- [`.logs/errors.md`](.logs/errors.md) — System errors, post-mortems, and resolution logs (includes ERR-008 through ERR-013 from Stage 2 investigation).
- [`.logs/patterns.md`](.logs/patterns.md) — System architecture patterns, gotchas, and guidelines (includes patterns 10-14 from investigation).
- [`tasks/plan.md`](tasks/plan.md) — High-level feature roadmap.
- [`tasks/todo.md`](tasks/todo.md) — Granular delivery stages and test gates.

### Agent Handoff Convention
Agents communicate via explicit markers in code and docs:
`// @agent:[agent_name] [actionable task]`

*Next Pipeline Actions:*
```
// @agent:archivist Implement PostgreSQL migrations runner and RLS policies from src/db/migrations/0001_init.sql (Stage 1)
// @agent:forge Implement NextAuth development session integration & authentication middleware (Stage 1)
```
