# Triple Pass Protocol: Research-Driven Ingestion Engine, Event Pipeline & Developer Mode Logs

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