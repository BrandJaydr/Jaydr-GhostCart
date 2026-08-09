-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0002: Schema Hardening
-- Stage 1 — constraints, indexes, canonical product columns, audit guarantees
-- Additive & idempotent. Applied by `npm run db:migrate` (src/db/migrate.ts).
-- Reference: Production Blueprint §6.1; TECHNICAL_WIKI "Incomplete migration" §11.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Users ────────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_tenant_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id);

-- ─── Tenants ──────────────────────────────────────────────────────────────────
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_plan TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB;

-- ─── Suppliers ────────────────────────────────────────────────────────────────
-- Enforce one approved adapter of a given type per tenant.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_tenant_adapter_key') THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_tenant_adapter_key UNIQUE (tenant_id, adapter_id);
  END IF;
END $$;

-- ─── Products ─────────────────────────────────────────────────────────────────
-- CanonicalProduct fields explicitly absent from 0001 (see src/lib/types/canonical.ts).
ALTER TABLE products ADD COLUMN IF NOT EXISTS identifiers JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_image_urls TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS confidence JSONB;

CREATE INDEX IF NOT EXISTS products_tenant_id_idx ON products (tenant_id);

-- ─── Product Sources ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS product_sources_tenant_id_idx ON product_sources (tenant_id);
CREATE INDEX IF NOT EXISTS product_sources_product_id_idx ON product_sources (product_id);

-- ─── Listing Drafts ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listing_drafts_state_check') THEN
    ALTER TABLE listing_drafts ADD CONSTRAINT listing_drafts_state_check
      CHECK (state IN ('draft','ready_for_review','queued','submitted','published','failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS listing_drafts_tenant_state_idx ON listing_drafts (tenant_id, state);

-- ─── Marketplace Connections ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mkt_conn_tenant_marketplace_key') THEN
    ALTER TABLE marketplace_connections ADD CONSTRAINT mkt_conn_tenant_marketplace_key
      UNIQUE (tenant_id, marketplace);
  END IF;
END $$;

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS jobs_tenant_status_idx ON jobs (tenant_id, status);

-- ─── Audit Events ─────────────────────────────────────────────────────────────
-- Ordering index for auditing/activity-history queries.
CREATE INDEX IF NOT EXISTS audit_events_tenant_created_idx
  ON audit_events (tenant_id, created_at DESC);
