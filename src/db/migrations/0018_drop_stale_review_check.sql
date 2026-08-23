-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0018: Drop stale review_status CHECK
-- Stage 2 — Fix: product imports rejected by legacy TEXT-era constraint
-- ─────────────────────────────────────────────────────────────────────────────
-- 0005_import_alpha added products.review_status as TEXT with:
--     CHECK (review_status IN ('needs_review', 'ready'))
-- 0014_review_state migrated the column to review_status_enum
--   ('pending_review', 'approved', 'rejected') but did NOT drop that CHECK.
-- Every import INSERT with 'pending_review' therefore failed with
-- products_review_status_check (23514), so imports never persisted
-- (worker log: "DB persistence failed ... violates check constraint").
--
-- The enum type already enforces the allowed values; the stale CHECK is
-- superseded dead weight. Dropping it is additive-safe (no data changes).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_review_status_check;