-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0014: Review State
-- Stage 2 — Add review-before-use state for products
-- Reference: Production Blueprint §6.2 (review-before-use state)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Create review_status enum ─────────────────────────────────────────────────
-- Values: pending_review, approved, rejected
CREATE TYPE review_status_enum AS ENUM ('pending_review', 'approved', 'rejected');

-- ── Add review_status column to products table ─────────────────────────────────
-- Default to 'approved' for existing products for backward compatibility
ALTER TABLE products
ADD COLUMN IF NOT EXISTS review_status review_status_enum DEFAULT 'approved';

-- ── Add review audit trail columns ─────────────────────────────────────────────
ALTER TABLE products
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- ── Add index on review_status for efficient querying ───────────────────────
CREATE INDEX IF NOT EXISTS idx_products_review_status ON products(review_status);

-- ── Add index on reviewed_at for sorting by review date ───────────────────────
CREATE INDEX IF NOT EXISTS idx_products_reviewed_at ON products(reviewed_at DESC);

-- ── Update existing products to approved status ───────────────────────────────
UPDATE products
SET review_status = 'approved'
WHERE review_status IS NULL;

-- ── Set NOT NULL constraint after migration ───────────────────────────────────
ALTER TABLE products
ALTER COLUMN review_status SET NOT NULL;

-- ── Add foreign key constraint for reviewed_by to users table ─────────────────
ALTER TABLE products
ADD CONSTRAINT fk_products_reviewed_by
FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ── Comment the new columns for documentation ─────────────────────────────────
COMMENT ON COLUMN products.review_status IS 'Review state: pending_review, approved, rejected. Products enter pending_review on import and require manual approval.';
COMMENT ON COLUMN products.reviewed_at IS 'Timestamp when product was reviewed (approved/rejected).';
COMMENT ON COLUMN products.reviewed_by IS 'User ID who reviewed the product.';
COMMENT ON TYPE review_status_enum IS 'Enum for product review states: pending_review (awaiting review), approved (ready for use), rejected (not suitable for use).';

-- ── Create function to transition review state with audit logging ────────────
CREATE OR REPLACE FUNCTION set_product_review_status(
    p_product_id UUID,
    p_new_status review_status_enum,
    p_reviewed_by UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products
    SET 
        review_status = p_new_status,
        reviewed_at = NOW(),
        reviewed_by = p_reviewed_by
    WHERE id = p_product_id;
    
    -- Emit audit event for review state change
    INSERT INTO audit_events (
        tenant_id, 
        user_id, 
        action, 
        entity_type, 
        entity_id, 
        metadata, 
        created_at
    )
    SELECT 
        tenant_id,
        p_reviewed_by,
        'product.review_status_changed',
        'products',
        p_product_id,
        jsonb_build_object(
            'old_status', review_status,
            'new_status', p_new_status,
            'reviewed_at', NOW()
        ),
        NOW()
    FROM products
    WHERE id = p_product_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Grant execute permission on function ─────────────────────────────────────
GRANT EXECUTE ON FUNCTION set_product_review_status TO ghostcart_app;
