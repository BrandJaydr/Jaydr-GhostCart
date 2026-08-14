-- ─────────────────────────────────────────────────────────────────────────────
-- 0015_alerts.sql — Alert events (Stage 4 ops hardening)
-- Ops-facing record of operational alerts (DLQ/final job failure, stalled jobs,
-- rate-limit thresholds) written by the alerting module (src/lib/alerts/).
-- RLS notice: tenant_id is nullable for global/ops alerts; tenant-scoped rows are
-- covered by existing RLS policies where the app sets ghostcart.tenant_id.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alert_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID,
  alert_type TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'warning'
             CHECK (severity IN ('info', 'warning', 'critical')),
  message    TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  channel    TEXT,
  status     TEXT NOT NULL DEFAULT 'new'
             CHECK (status IN ('new', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alert_events_tenant_created
  ON alert_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_status
  ON alert_events (status);