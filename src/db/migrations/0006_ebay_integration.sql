-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0006: eBay Integration Schema
-- Stage: Stage 3 — eBay Sandbox Integration
-- Reference: Stage 3 Implementation Plan — Task 2: eBay Sandbox Integration
-- ─────────────────────────────────────────────────────────────────────────────
-- @agent:archivist Add row-level security (RLS) policies on all eBay tables
-- @agent:archivist Add indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Marketplace Connections ─────────────────────────────────────────────────
-- Stores per-tenant marketplace API credentials (encrypted)
-- Note: marketplace_connections table already exists in 0001_init.sql
-- This migration adds eBay-specific columns and encryption support

ALTER TABLE marketplace_connections
ADD COLUMN IF NOT EXISTS app_id TEXT,
ADD COLUMN IF NOT EXISTS cert_id TEXT,
ADD COLUMN IF NOT EXISTS dev_id TEXT,
ADD COLUMN IF NOT EXISTS ru_name TEXT,
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Index for tenant + marketplace lookups
CREATE INDEX IF NOT EXISTS mkt_conn_tenant_marketplace_env_idx
ON marketplace_connections(tenant_id, marketplace, environment);

-- ─── Webhook Events ───────────────────────────────────────────────────────────
-- Logs incoming webhook events for replay protection and debugging
CREATE TABLE IF NOT EXISTS webhook_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  marketplace         TEXT NOT NULL,
  event_type          TEXT NOT NULL,
  event_id            TEXT NOT NULL, -- Unique event ID from marketplace
  payload             JSONB NOT NULL,
  signature           TEXT, -- Webhook signature for verification
  verified            BOOLEAN NOT NULL DEFAULT false,
  processed           BOOLEAN NOT NULL DEFAULT false,
  processed_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, marketplace, event_id)
);

-- Index for event lookups
CREATE INDEX IF NOT EXISTS webhook_events_tenant_idx ON webhook_events(tenant_id);
CREATE INDEX IF NOT EXISTS webhook_events_marketplace_idx ON webhook_events(marketplace);
CREATE INDEX IF NOT EXISTS webhook_events_processed_idx ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS webhook_events_created_idx ON webhook_events(created_at DESC);

-- ─── Polling State ─────────────────────────────────────────────────────────────
-- Tracks last poll timestamps for fallback polling mechanism
CREATE TABLE IF NOT EXISTS polling_state (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  marketplace         TEXT NOT NULL,
  resource_type       TEXT NOT NULL, -- 'listings', 'orders', etc.
  last_polled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_id        TEXT, -- Last ID synced for incremental updates
  poll_interval       INTEGER NOT NULL DEFAULT 300, -- Seconds
  next_poll_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, marketplace, resource_type)
);

-- Index for polling schedule queries
CREATE INDEX IF NOT EXISTS polling_state_next_poll_idx ON polling_state(next_poll_at);

-- ─── Row-Level Security Policies ─────────────────────────────────────────────

ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_state ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can only see their own marketplace connections
CREATE POLICY marketplace_connections_tenant_isolation ON marketplace_connections
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Policy: Tenants can only see their own webhook events
CREATE POLICY webhook_events_tenant_isolation ON webhook_events
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Policy: Tenants can only see their own polling state
CREATE POLICY polling_state_tenant_isolation ON polling_state
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- ─── Functions for Token Management ───────────────────────────────────────────

-- Function to check if access token needs refresh
CREATE OR REPLACE FUNCTION marketplace_connections.needs_token_refresh(connection_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expires_at TIMESTAMPTZ;
BEGIN
  SELECT token_expires_at INTO expires_at
  FROM marketplace_connections
  WHERE id = connection_id;

  RETURN expires_at IS NULL OR expires_at < now() + interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to update access token
CREATE OR REPLACE FUNCTION marketplace_connections.update_access_token(
  connection_id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expires_in INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_connections
  SET access_token = $2,
      refresh_token = COALESCE($3, refresh_token),
      token_expires_at = now() + (expires_in || ' seconds')::interval,
      updated_at = now()
  WHERE id = $1;
END;
$$ LANGUAGE plpgsql;
