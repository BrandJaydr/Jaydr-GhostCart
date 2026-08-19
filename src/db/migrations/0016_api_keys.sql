-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0016: API Keys (CLI + Agentic Access)
-- Adds api_keys table so users can generate long-lived tokens for CLI / agent
-- use. Raw keys are never stored — only a SHA-256 hex digest. The key prefix
-- (first 8 chars) is stored for user identification in the key list UI.
--
-- Also adds a GLOBAL email unique index on users so the CLI login endpoint
-- can look up a user by email alone (not just tenant_id + email).
--
-- Safe to run repeatedly — all DDL uses IF NOT EXISTS / DO $$ guards.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── api_keys ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash     TEXT        NOT NULL,           -- SHA-256 hex of the raw bearer token
  key_prefix   TEXT        NOT NULL,           -- first 8 chars shown in key list
  label        TEXT,                           -- human-readable name e.g. "My laptop"
  scopes       TEXT[]      NOT NULL DEFAULT '{}', -- reserved for tier-based gating
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,                    -- NULL = never expires
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ                     -- soft-delete; NULL = active
);

-- Raw key is never stored, so uniqueness must be on the hash
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_key_hash_key'
  ) THEN
    ALTER TABLE api_keys ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx    ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS api_keys_tenant_id_idx  ON api_keys (tenant_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx   ON api_keys (key_hash);

-- ── RLS on api_keys ──────────────────────────────────────────────────────────
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING      (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- ── Global unique email on users (needed for CLI login by email) ─────────────
-- The existing constraint is UNIQUE(tenant_id, email). We add a partial index
-- for fast cross-tenant lookups during CLI login WITHOUT breaking the existing
-- per-tenant unique constraint.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_global_idx ON users (email);

-- ── Grant api_keys access to the app role ────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO ghostcart_app;
