-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0004: User Corrections & Idempotency
-- Stage 2 — Add user_corrections tracking for product manual corrections and
--           UNIQUE(source_url) constraint for duplicate detection.
-- Reference: Production Blueprint §6.1 (audit trail) + Stage 2 idempotency
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add user_corrections JSONB column to products table ───────────────────────
-- Structure: { fieldName: { original: string, corrected: string, correctedAt: string, correctedBy: string } }
-- @agent:archivist Review RLS policy alignment for this new column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS user_corrections JSONB DEFAULT '{}'::jsonb;

-- ── Add source_url column ─────────────────────────────────────────────────────
-- Required for duplicate detection. Nullable to avoid breaking existing rows
-- until imports populate it via the worker.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- ── Add UNIQUE constraint on source_url for duplicate detection ───────────────
-- This provides the database-level safety net for idempotency enforcement.
-- API layer will check for duplicates before enqueuing for UX (409 Conflict).
-- @agent:atlas Implement API layer duplicate detection in POST /api/products
ALTER TABLE products
ADD CONSTRAINT products_source_url_unique UNIQUE (source_url);

-- ── Add index on source_url for duplicate detection performance ───────────────
-- Speeds up the UNIQUE constraint check and API layer duplicate queries.
CREATE INDEX IF NOT EXISTS idx_products_source_url ON products(source_url);

-- ── Add index on user_corrections for correction history queries ─────────────
-- Enables efficient querying of products with pending corrections.
CREATE INDEX IF NOT EXISTS idx_products_user_corrections ON products USING GIN(user_corrections);

-- ── Comment the new columns for documentation ─────────────────────────────────
COMMENT ON COLUMN products.user_corrections IS 'User manual corrections tracking. Structure: { fieldName: { original, corrected, correctedAt, correctedBy } }';
COMMENT ON CONSTRAINT products_source_url_unique ON products IS 'Prevents duplicate imports from the same supplier URL (idempotency safety net)';
