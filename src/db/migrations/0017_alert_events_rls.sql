-- ─────────────────────────────────────────────────────────────────────────────
-- 0017_alert_events_rls.sql — RLS policy enablement for alert_events table
-- Scopes access to the session GUC tenant_id and grants app role access.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can only select alerts scoped to their active tenant_id.
CREATE POLICY alert_events_select ON alert_events
  FOR SELECT USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- INSERT policy: App can insert alert events matching its active tenant, or global alerts (NULL tenant_id).
CREATE POLICY alert_events_insert ON alert_events
  FOR INSERT WITH CHECK (
    tenant_id = current_setting('ghostcart.tenant_id', true)::uuid 
    OR tenant_id IS NULL
  );

-- UPDATE policy: App can only acknowledge/resolve alert events that belong to its active tenant.
CREATE POLICY alert_events_update ON alert_events
  FOR UPDATE USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Grant DML privileges to the non-superuser application role
GRANT SELECT, INSERT, UPDATE ON alert_events TO ghostcart_app;
