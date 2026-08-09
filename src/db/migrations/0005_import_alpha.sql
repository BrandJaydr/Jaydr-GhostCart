-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0005: Import Alpha
-- Stage 2 — Functional Alpha: Real Product Import
--   • review-before-use gate (`products.review_status`)
--   • import instrumentation (`import_duration_ms`, `normalization_completeness`)
--   • product_sources traceability index
--   • dead-letter queue table (DLQ) for jobs that exhaust their retry attempts
--   • CSV supplier seed (the first real, authorized supplier adapter)
-- Additive & idempotent. Applied by `npm run db:migrate` (src/db/migrate.ts).
-- Reference: Production Blueprint §3.1/§6.1; tasks/todo.md Stage 2.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── products: review-before-use gate ────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'needs_review';

-- ─── products: import instrumentation ────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS import_duration_ms INTEGER;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS normalization_completeness NUMERIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_review_status_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_review_status_check
      CHECK (review_status IN ('needs_review', 'ready'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_norm_completeness_check') THEN
    ALTER TABLE products ADD CONSTRAINT products_norm_completeness_check
      CHECK (
        normalization_completeness IS NULL
        OR (normalization_completeness >= 0 AND normalization_completeness <= 1)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_tenant_review_idx ON products (tenant_id, review_status);

-- ─── product_sources: traceability / duplicate lookups ───────────────────────
CREATE INDEX IF NOT EXISTS product_sources_tenant_source_idx
  ON product_sources (tenant_id, source_url);

-- ─── dead_letter_queue (DLQ) ─────────────────────────────────────────────────
-- Jobs that exhaust their retry attempts are moved here (worker) so operators
-- can reconcile them. Mirrors BullMQ state but is durable + tenant-scoped.
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  queue         TEXT NOT NULL,
  bull_job_id   TEXT,
  payload       JSONB,
  error         TEXT,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same tenant-isolation posture as the other tables (0003); fail-closed.
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY dead_letter_queue_all_tenant ON dead_letter_queue
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Belt & braces in case default privileges drift; otherwise covered by 0003.
GRANT SELECT, INSERT, UPDATE, DELETE ON dead_letter_queue TO ghostcart_app;

-- ─── CSV supplier seed (dev tenant) ──────────────────────────────────────────
-- First real authorized supplier adapter: a user-provided CSV feed. The worker
-- resolves the suppliers row by (tenant_id, adapter_id='csv') to write the
-- product_sources traceability link.
INSERT INTO suppliers (tenant_id, adapter_id, name, config)
SELECT id, 'csv', 'CSV Catalog Feed', '{"kind":"csv"}'
FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, adapter_id) DO NOTHING;