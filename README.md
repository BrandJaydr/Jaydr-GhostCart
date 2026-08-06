# Jaydr GhostCart 🛒⚡

**Enterprise Reseller & Dropshipping Automation Platform**

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

Rather than deploying complex microservices early, the **Stage 1 Thin Vertical Slice** implements a single end-to-end merchant workflow:
> *A signed-in merchant imports an approved supplier product, reviews normalized data and pricing, generates an editable listing draft, and exports or submits that draft through one approved marketplace path.*

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
        │
        └─► Marketplace / Supplier Adapters (Normalized Canonical Contracts)
```

- **Frontend & API:** React / Next.js (TypeScript)
- **Database:** PostgreSQL (Multi-tenant, audit records, job state)
- **Asynchronous Tasks:** Durable job queue with worker process
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

4. **Install Dependencies & Run Dev Server:**
   ```bash
   npm install
   npm run dev
   ```

---

## 🧠 AOP-CORE Agent Pipeline & Governance

Jaydr GhostCart is built and maintained following **AOP-CORE v1.0** (Agent Orchestration & Pipeline Core).

### Shared Memory Registers
- [`.logs/errors.md`](.logs/errors.md) — System errors, post-mortems, and resolution logs.
- [`.logs/patterns.md`](.logs/patterns.md) — System architecture patterns, gotchas, and guidelines.
- [`tasks/plan.md`](tasks/plan.md) — High-level feature roadmap.
- [`tasks/todo.md`](tasks/todo.md) — Granular delivery stages and test gates.

### Agent Handoff Convention
Agents communicate via explicit markers in code and docs:
`// @agent:[agent_name] [actionable task]`

*Next Pipeline Actions:*
```
// @agent:atlas Define and implement API contracts for /api/products and /api/listings (Stage 1)
// @agent:archivist Implement PostgreSQL migrations runner and RLS policies from src/db/migrations/0001_init.sql
// @agent:forge (Stage 2) Implement next-auth session, app shell navigation, and design tokens
```
