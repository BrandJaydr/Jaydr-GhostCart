-- ─────────────────────────────────────────────────────────────────────────────
-- 0004b_listings.sql — Corrective migration: create the `listings` table
--
-- Corrective fix (Option A). The `listings` table was referenced with FKs and
-- ALTERs (0005_ai_insights, 0010_margin_calculation, 0011_repricing_system)
-- and queried by dashboard views (0013) and the eBay submit route, but NO
-- migration ever CREATEd it (only `listing_drafts` exists). Placed here so it
-- sorts before 0005, letting the whole chain apply cleanly with no edits to
-- committed migrations. Non-destructive & idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id              UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace             TEXT NOT NULL,
  state                   TEXT NOT NULL DEFAULT 'draft',
  title                   TEXT,
  description             TEXT,
  list_price_cents        INTEGER,
  currency                TEXT NOT NULL DEFAULT 'USD',
  attributes              JSONB,
  shipping                JSONB,
  image_urls              TEXT[],
  idempotency_key         TEXT UNIQUE,
  marketplace_listing_id  TEXT,
  last_error              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_tenant_idx ON listings(tenant_id);
CREATE INDEX IF NOT EXISTS listings_tenant_state_idx ON listings(tenant_id, state);

-- Tenant isolation (same posture as other tables)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY listings_tenant_isolation ON listings
  FOR ALL
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);
