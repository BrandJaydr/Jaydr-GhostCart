-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0020: Airtable supplier (OAuth connections)
-- Stage 5 — "Sign in with Airtable" OAuth 2.0 supplier adapter
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds a per-user `airtable_connections` table (tokens, RLS tenant-scoped)
-- mirroring the api_keys pattern (migration 0016) and seeds the `airtable`
-- supplier row for the dev tenant (mirroring migration 0019_html_supplier).
--
-- Tokens are stored server-side. At-rest encryption (AES-256/GCM) of
-- `suppliers.config` remains a tracked TODO (migration 0001) — non-secret
-- baseId/tableName/fieldMapping live in config, secrets live here.
--
-- Safe to run repeatedly — all DDL uses IF NOT EXISTS / DO $$ guards.

-- ─── airtable_connections ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS airtable_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  base_id          TEXT,
  scopes           TEXT[] NOT NULL DEFAULT '{}',
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS airtable_connections_tenant_idx ON airtable_connections (tenant_id);
CREATE INDEX IF NOT EXISTS airtable_connections_user_idx   ON airtable_connections (user_id);

-- ─── RLS on airtable_connections ────────────────────────────────────────────
ALTER TABLE airtable_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY airtable_connections_tenant_isolation ON airtable_connections
  USING      (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON airtable_connections TO ghostcart_app;

-- ─── Seed the airtable supplier (dev tenant) ────────────────────────────────
INSERT INTO suppliers (tenant_id, adapter_id, name, config)
SELECT id, 'airtable', 'Airtable', '{"baseId":null,"tableName":null,"fieldMapping":{}}'
FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (tenant_id, adapter_id) DO NOTHING;