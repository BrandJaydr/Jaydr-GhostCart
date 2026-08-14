-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Jaydr GhostCart â€” Migration 0009: Stock/Price Refresh System
-- Stage: Stage 4 â€” Reliability and Controlled Automation
-- Reference: Stage 4 Plan â€” Task 1: Stock/Price Refresh System
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Enhance Products Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Add stock and price tracking fields

ALTER TABLE products
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMPTZ DEFAULT NULL;

-- Index for stock-based queries
CREATE INDEX IF NOT EXISTS products_stock_idx ON products(current_stock) WHERE current_stock IS NOT NULL;
-- Index for price update queries
CREATE INDEX IF NOT EXISTS products_price_update_idx ON products(last_price_update) WHERE last_price_update IS NOT NULL;

-- â”€â”€â”€ Price History Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Track price changes over time for analysis

CREATE TABLE IF NOT EXISTS price_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price_cents     INTEGER,
  new_price_cents     INTEGER NOT NULL,
  change_cents        INTEGER GENERATED ALWAYS AS (new_price_cents - old_price_cents) STORED,
  change_percent      NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN old_price_cents > 0
      THEN ((new_price_cents::NUMERIC - old_price_cents::NUMERIC) / old_price_cents::NUMERIC) * 100
      ELSE NULL
    END
  ) STORED,
  source              TEXT NOT NULL, -- 'manual', 'scheduled', 'api', 'webhook'
  triggered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for price history queries
CREATE INDEX IF NOT EXISTS price_history_product_idx ON price_history(product_id);
CREATE INDEX IF NOT EXISTS price_history_tenant_idx ON price_history(tenant_id);
CREATE INDEX IF NOT EXISTS price_history_created_idx ON price_history(created_at DESC);

-- â”€â”€â”€ Row-Level Security Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_history_tenant_isolation ON price_history
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Functions for Price Change Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Function to detect and log price changes
CREATE OR REPLACE FUNCTION log_price_change(
  p_product_id UUID,
  p_old_price_cents INTEGER,
  p_new_price_cents INTEGER,
  p_source TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_history_id UUID;
BEGIN
  -- Get tenant_id from product
  SELECT tenant_id INTO v_tenant_id FROM products WHERE id = p_product_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Only log if price actually changed
  IF p_old_price_cents IS NULL OR p_old_price_cents != p_new_price_cents THEN
    INSERT INTO price_history (tenant_id, product_id, old_price_cents, new_price_cents, source, triggered_by)
    VALUES (v_tenant_id, p_product_id, p_old_price_cents, p_new_price_cents, p_source, p_user_id)
    RETURNING id INTO v_history_id;

    -- Update product's last price update timestamp
    UPDATE products
    SET supplier_price_cents = p_new_price_cents,
        last_price_update = now()
    WHERE id = p_product_id;

    RETURN v_history_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to detect and log stock changes
CREATE OR REPLACE FUNCTION log_stock_change(
  p_product_id UUID,
  p_old_stock INTEGER,
  p_new_stock INTEGER,
  p_source TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only log if stock actually changed
  IF p_old_stock IS NULL OR p_old_stock != p_new_stock THEN
    UPDATE products
    SET current_stock = p_new_stock,
        last_stock_update = now()
    WHERE id = p_product_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Scheduled Refresh Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Add table for scheduled refresh configuration
CREATE TABLE IF NOT EXISTS scheduled_refreshes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL for all products
  refresh_type        TEXT NOT NULL CHECK (refresh_type IN ('stock', 'price', 'both')),
  schedule            TEXT NOT NULL, -- Cron expression
  enabled             BOOLEAN NOT NULL DEFAULT true,
  last_run_at         TIMESTAMPTZ,
  next_run_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, product_id, refresh_type)
);

-- Index for scheduled refresh lookups
CREATE INDEX IF NOT EXISTS scheduled_refreshes_tenant_idx ON scheduled_refreshes(tenant_id);
CREATE INDEX IF NOT EXISTS scheduled_refreshes_next_run_idx ON scheduled_refreshes(next_run_at) WHERE enabled = true;

-- Row-Level Security for scheduled refreshes
ALTER TABLE scheduled_refreshes ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_refreshes_tenant_isolation ON scheduled_refreshes
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);
