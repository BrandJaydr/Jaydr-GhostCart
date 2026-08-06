-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0001: Initial Schema
-- Stage: Stage 1 — Core Domain Model
-- Reference: Production Blueprint §6.1 Core records for the first slice
-- ─────────────────────────────────────────────────────────────────────────────
-- @agent:archivist Implement field types, constraints, and indexes below
-- @agent:archivist Add row-level security (RLS) policies per tenant_id on all tables
-- @agent:archivist Add rollback/recovery procedure document for this migration
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tenants ──────────────────────────────────────────────────────────────────
-- @agent:archivist Add: name, plan_tier, created_at, suspended_at
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended_at TIMESTAMPTZ
  -- TODO: @agent:archivist Add billing_plan, settings JSONB
);

-- ─── Users ────────────────────────────────────────────────────────────────────
-- @agent:archivist Add: email, hashed_password, tenant_id FK, role, last_login
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'owner',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- TODO: @agent:archivist Add UNIQUE(tenant_id, email), indexes, RLS policy
);

-- ─── Suppliers ────────────────────────────────────────────────────────────────
-- @agent:archivist Catalog of approved supplier adapters per tenant
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  adapter_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  config      JSONB,   -- Encrypted API credentials stored here (never plain text)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- TODO: @agent:archivist Encrypt config column at rest (AES-256 / KMS)
);

-- ─── Products ─────────────────────────────────────────────────────────────────
-- @agent:archivist CanonicalProduct fields mapped to columns
CREATE TABLE IF NOT EXISTS products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  supplier_price_cents  INTEGER NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'USD',
  availability          TEXT NOT NULL DEFAULT 'unknown',
  primary_image_url     TEXT,
  imported_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_refreshed_at     TIMESTAMPTZ
  -- TODO: @agent:archivist Add: identifiers JSONB, additional_image_urls TEXT[], confidence JSONB
);

-- ─── Product Sources ──────────────────────────────────────────────────────────
-- @agent:archivist Links products to their supplier source for traceability
CREATE TABLE IF NOT EXISTS product_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  supplier_id         UUID NOT NULL REFERENCES suppliers(id),
  source_url          TEXT NOT NULL,
  raw_source_metadata JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Listing Drafts ───────────────────────────────────────────────────────────
-- @agent:archivist State machine: draft→ready_for_review→queued→submitted→published→failed
CREATE TABLE IF NOT EXISTS listing_drafts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id              UUID NOT NULL REFERENCES products(id),
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
  -- TODO: @agent:archivist Add CHECK constraint on state enum values
  -- TODO: @agent:archivist Add index on (tenant_id, state)
);

-- ─── Marketplace Connections ──────────────────────────────────────────────────
-- @agent:archivist Stores per-tenant marketplace API credentials (encrypted)
CREATE TABLE IF NOT EXISTS marketplace_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  marketplace   TEXT NOT NULL,
  credentials   JSONB, -- Encrypted — @agent:archivist: encrypt at rest
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at   TIMESTAMPTZ
  -- TODO: @agent:archivist Add UNIQUE(tenant_id, marketplace)
);

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
-- @agent:archivist Persistent record of all async jobs (mirrors BullMQ state)
CREATE TABLE IF NOT EXISTS jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  type              TEXT NOT NULL,
  payload           JSONB NOT NULL,
  idempotency_key   TEXT UNIQUE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- ─── Audit Events ─────────────────────────────────────────────────────────────
-- @agent:archivist Immutable log — NO UPDATE or DELETE allowed (RLS enforced)
-- @agent:archivist Every external write must produce an audit event
CREATE TABLE IF NOT EXISTS audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- TODO: @agent:archivist Add RLS: INSERT only, no UPDATE/DELETE
  -- TODO: @agent:archivist Add index on (tenant_id, created_at DESC)
);
