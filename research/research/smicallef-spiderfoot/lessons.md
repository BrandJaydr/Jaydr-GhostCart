# smicallef/spiderfoot - Applicable Lessons for Jaydr GhostCart

## 1. Applicable Positive Patterns

### Pattern 1: Event-Driven Asynchronous Product Enrichment Pipeline
- **SpiderFoot approach:** Instead of monolithic sequential scraping, each discovery (e.g. `DOMAIN` -> `SUBDOMAIN` -> `IP`) is an event consumed by independent, single-responsibility modules.
- **GhostCart adaptation:** Convert GhostCart's product ingestion pipeline into an event-driven flow on BullMQ:
  1. `PRODUCT_URL_SUBMITTED` → Raw Ingestion Worker fetches and normalizes core product fields.
  2. `PRODUCT_INGESTED` → Triggers parallel downstream enrichment jobs:
     - `ShippingCalculatorWorker` (calculates freight & landed cost)
     - `AIListingOptimizationWorker` (generates SEO titles/descriptions via Ollama/VLLM)
     - `ImageOptimizationWorker` (resizes & cleans supplier images)
     - `RepricingRuleEvaluator` (evaluates margin thresholds)
  3. `PRODUCT_ENRICHED` → Marks product as `ready_for_review` or creates `listing_draft`.

### Pattern 2: Immutable Data Lineage & Provenance Tracking
- **SpiderFoot approach:** Every event stores `sourceEventHash`, making it possible to trace any piece of data back to its origin.
- **GhostCart adaptation:** Store an audit trail of how listing fields were synthesized:
  - Title came from: Supplier Raw (80%) + AI Optimizer (v2 prompt) + User Correction.
  - Price came from: Supplier Base ($12.00) + Shipping ($3.50) + Margin Rule (+35%).

### Pattern 3: Centralized Shared Fetcher with Caching & Throttling
- **SpiderFoot approach:** A unified `fetchUrl()` helper handles rate limiting per host, caching, and payload size bounds.
- **GhostCart adaptation:** Replace ad-hoc `fetch()` calls in `src/lib/adapters/` with a shared `HttpClient` primitive that provides:
  - Redis-backed response caching for supplier catalog pages during bulk operations.
  - Host-based rate limiting (e.g., max 2 req/sec to `aliexpress.com`).
  - Max body size guards to prevent memory bloat.

### Pattern 4: Declarative Plugin Capabilities & Graceful Degradation
- **SpiderFoot approach:** Modules declare their requirements (e.g., requires API key `X`, watches event `Y`).
- **GhostCart adaptation:** Enhance `ISupplierAdapter` so adapters declare their capabilities (`canScrapeWithoutCredentials`, `supportsVariants`, `supportsRealtimeStock`, `requiresCredentials`), allowing the UI and worker to dynamically select the best ingestion path.

## 2. Anti-Patterns to Avoid

1. **Monolithic In-Memory Event Queues:** SpiderFoot's threading/local event queue is not distributed across nodes. GhostCart should continue using **BullMQ + Redis**, which provides distributed persistence, concurrency tuning, and dead-letter queues.
2. **Synchronous Polling Loops:** SpiderFoot's web UI periodically polls the database for scan updates. GhostCart uses server-side events, webhooks, and reactive BullMQ events.
