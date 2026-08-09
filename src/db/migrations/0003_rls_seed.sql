-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0003: RLS + Application Role + Dev Seed
-- Stage 1 — "secure by default": least-privilege app role, tenant-scoped
-- row-level security, and dev fixtures so the worker can persist end-to-end.
-- Reference: Production Blueprint §6.1 + §2 (secure by default, tenant isolation).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Application role (least privilege) ──────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ghostcart_app') THEN
    -- NOLOGIN: the app connects via a managed connection and `SET ROLE`.
    CREATE ROLE ghostcart_app NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ghostcart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ghostcart_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ghostcart_app;

-- Default privileges so future migrations' new tables stay grantable.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ghostcart_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ghostcart_app;

-- ── Row-Level Security (fail-closed) ────────────────────────────────────────
-- Pattern: tenant tables are filtered by the per-session GUC
--   `ghostcart.tenant_id` (set with `set_config('ghostcart.tenant_id', $1, true)`).
-- When unset, current_setting(..., true) yields NULL → policies deny (secure default).
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- tenants
CREATE POLICY tenants_select_own ON tenants
  FOR SELECT USING (id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Standard tenant-isolation policies (USING for read, WITH CHECK for write)
CREATE POLICY users_all_tenant ON users
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY suppliers_all_tenant ON suppliers
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY products_all_tenant ON products
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY product_sources_all_tenant ON product_sources
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY listing_drafts_all_tenant ON listing_drafts
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY marketplace_connections_all_tenant ON marketplace_connections
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

CREATE POLICY jobs_all_tenant ON jobs
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- audit_events: immutable (INSERT/SELECT only; no UPDATE/DELETE)
CREATE POLICY audit_events_select ON audit_events
  FOR SELECT USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);
CREATE POLICY audit_events_insert ON audit_events
  FOR INSERT WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Defence in depth: revoke UPDATE/DELETE on audit_events from the app role
REVOKE UPDATE, DELETE ON audit_events FROM ghostcart_app;

-- ── Dev seed (Stage 1 fixtures) ──────────────────────────────────────────────
-- Well-known dev tenant UUID. App code must set `ghostcart.tenant_id` to this
-- (or the authenticated tenant's UUID) per request so RLS resolves correctly.
INSERT INTO tenants (id, name, billing_plan, settings)
VALUES ('00000000-0000-0000-0000-000000000001', 'Dev Tenant', 'pilot', '{"env":"dev"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (tenant_id, email, role, hashed_password)
SELECT id, 'dev@ghostcart.local', 'owner', NULL
FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- mock supplier (adapter_id 'mock') scoped to the dev tenant
INSERT INTO suppliers (tenant_id, adapter_id, name, config)
SELECT id, 'mock', 'Mock Supplier', '{"fixture":true}'
FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, adapter_id) DO NOTHING;
