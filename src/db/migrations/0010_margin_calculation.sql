-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Jaydr GhostCart â€” Migration 0010: Margin Calculation Engine
-- Stage: Stage 4 â€” Reliability and Controlled Automation
-- Reference: Stage 4 Plan â€” Task 2: Margin Calculation Engine
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Enhance Listings Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Add margin calculation fields

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS calculated_margin_percent NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS calculated_profit_cents INTEGER,
ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';

-- Index for margin-based queries
CREATE INDEX IF NOT EXISTS listings_margin_idx ON listings(calculated_margin_percent) WHERE calculated_margin_percent IS NOT NULL;

-- â”€â”€â”€ Fee Structures Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store marketplace fee structures for margin calculations

CREATE TABLE IF NOT EXISTS fee_structures (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace         TEXT NOT NULL,
  fee_type            TEXT NOT NULL CHECK (fee_type IN ('listing', 'final_value', 'payment', 'subscription', 'other')),
  fee_name            TEXT NOT NULL,
  fee_formula         TEXT NOT NULL, -- JSON formula or percentage
  fixed_amount_cents  INTEGER DEFAULT 0,
  percentage_rate      NUMERIC(5, 4) DEFAULT 0,
  min_fee_cents       INTEGER DEFAULT NULL,
  max_fee_cents       INTEGER DEFAULT NULL,
  tier_ranges         JSONB DEFAULT '[]', -- For tiered fee structures
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to        TIMESTAMPTZ DEFAULT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fee structure lookups
CREATE INDEX IF NOT EXISTS fee_structures_marketplace_idx ON fee_structures(marketplace);
CREATE INDEX IF NOT EXISTS fee_structures_effective_idx ON fee_structures(effective_from, effective_to);

-- Row-Level Security for fee structures (admin-only)
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY fee_structures_admin_only ON fee_structures
  FOR ALL USING (true); -- Admin manages fee structures

-- â”€â”€â”€ Tax Jurisdictions Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store tax rates by jurisdiction for margin calculations

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code        TEXT NOT NULL,
  state_code          TEXT,
  tax_rate            NUMERIC(5, 4) NOT NULL,
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to        TIMESTAMPTZ DEFAULT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_code, state_code, effective_from)
);

-- Index for tax lookups
CREATE INDEX IF NOT EXISTS tax_jurisdictions_country_idx ON tax_jurisdictions(country_code);
CREATE INDEX IF NOT EXISTS tax_jurisdictions_effective_idx ON tax_jurisdictions(effective_from, effective_to);

-- Row-Level Security for tax jurisdictions (admin-only)
ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tax_jurisdictions_admin_only ON tax_jurisdictions
  FOR ALL USING (true);

-- â”€â”€â”€ Shipping Cost Rules Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store shipping cost calculation rules

CREATE TABLE IF NOT EXISTS shipping_cost_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  carrier             TEXT NOT NULL,
  service_type        TEXT NOT NULL,
  cost_type           TEXT NOT NULL CHECK (cost_type IN ('flat_rate', 'weight_based', 'volume_based', 'tiered')),
  base_cost_cents     INTEGER NOT NULL,
  per_unit_cents      INTEGER DEFAULT 0,
  weight_thresholds   JSONB DEFAULT '[]',
  volume_thresholds   JSONB DEFAULT '[]',
  tier_rates          JSONB DEFAULT '[]',
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to        TIMESTAMPTZ DEFAULT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for shipping cost lookups
CREATE INDEX IF NOT EXISTS shipping_cost_rules_tenant_idx ON shipping_cost_rules(tenant_id);
CREATE INDEX IF NOT EXISTS shipping_cost_rules_carrier_idx ON shipping_cost_rules(carrier);

-- Row-Level Security for shipping cost rules
ALTER TABLE shipping_cost_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipping_cost_rules_tenant_isolation ON shipping_cost_rules
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Functions for Margin Calculation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Function to calculate marketplace fees
CREATE OR REPLACE FUNCTION calculate_marketplace_fees(
  p_marketplace TEXT,
  p_selling_price_cents INTEGER,
  p_category TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_total_fees INTEGER := 0;
  v_fee RECORD;
BEGIN
  -- Get applicable fee structures
  FOR v_fee IN
    SELECT fixed_amount_cents, percentage_rate, min_fee_cents, max_fee_cents, tier_ranges
    FROM fee_structures
    WHERE marketplace = p_marketplace
      AND effective_from <= now()
      AND (effective_to IS NULL OR effective_to > now())
  LOOP
    -- Calculate fee based on type
    IF v_fee.percentage_rate > 0 THEN
      v_total_fees := v_total_fees + FLOOR(p_selling_price_cents * v_fee.percentage_rate);
    END IF;

    v_total_fees := v_total_fees + v_fee.fixed_amount_cents;

    -- Apply min/max constraints
    IF v_fee.min_fee_cents IS NOT NULL AND v_total_fees < v_fee.min_fee_cents THEN
      v_total_fees := v_fee.min_fee_cents;
    END IF;

    IF v_fee.max_fee_cents IS NOT NULL AND v_total_fees > v_fee.max_fee_cents THEN
      v_total_fees := v_fee.max_fee_cents;
    END IF;
  END LOOP;

  RETURN v_total_fees;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tax
CREATE OR REPLACE FUNCTION calculate_tax(
  p_country_code TEXT,
  p_price_cents INTEGER,
  p_state_code TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_tax_rate NUMERIC(5, 4);
  v_tax_cents INTEGER;
BEGIN
  -- Get applicable tax rate
  SELECT tax_rate INTO v_tax_rate
  FROM tax_jurisdictions
  WHERE country_code = p_country_code
    AND (state_code = p_state_code OR state_code IS NULL)
    AND effective_from <= now()
    AND (effective_to IS NULL OR effective_to > now())
  ORDER BY state_code DESC NULLS LAST
  LIMIT 1;

  IF v_tax_rate IS NULL THEN
    v_tax_rate := 0; -- Default to 0 if no tax rate found
  END IF;

  v_tax_cents := FLOOR(p_price_cents * v_tax_rate);

  RETURN v_tax_cents;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate shipping cost
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  p_tenant_id UUID,
  p_carrier TEXT DEFAULT NULL,
  p_weight_grams INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_shipping_cost INTEGER := 0;
  v_rule RECORD;
BEGIN
  -- Get applicable shipping rule
  SELECT base_cost_cents, per_unit_cents, weight_thresholds, tier_rates
  INTO v_rule
  FROM shipping_cost_rules
  WHERE tenant_id = p_tenant_id
    AND (carrier = p_carrier OR carrier IS NULL)
    AND effective_from <= now()
    AND (effective_to IS NULL OR effective_to > now())
  ORDER BY carrier DESC NULLS LAST
  LIMIT 1;

  IF v_rule IS NOT NULL THEN
    v_shipping_cost := v_rule.base_cost_cents;

    -- Add weight-based cost if applicable
    IF p_weight_grams IS NOT NULL AND v_rule.per_unit_cents > 0 THEN
      v_shipping_cost := v_shipping_cost + (p_weight_grams * v_rule.per_unit_cents);
    END IF;
  END IF;

  RETURN v_shipping_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate margin
CREATE OR REPLACE FUNCTION calculate_margin(
  p_selling_price_cents INTEGER,
  p_cost_cents INTEGER,
  p_marketplace TEXT,
  p_country_code TEXT DEFAULT 'US',
  p_state_code TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_carrier TEXT DEFAULT NULL,
  p_weight_grams INTEGER DEFAULT NULL
)
RETURNS NUMERIC(5, 2) AS $$
DECLARE
  v_fees INTEGER := 0;
  v_tax INTEGER := 0;
  v_shipping INTEGER := 0;
  v_total_cost INTEGER;
  v_profit_cents INTEGER;
  v_margin_percent NUMERIC(5, 2);
BEGIN
  -- Calculate fees
    v_fees := calculate_marketplace_fees(p_marketplace, p_selling_price_cents);

  -- Calculate tax
    v_tax := calculate_tax(p_country_code, p_price_cents, p_state_code);

  -- Calculate shipping
  IF p_tenant_id IS NOT NULL THEN
        v_shipping := calculate_shipping_cost(p_tenant_id, p_carrier, p_weight_grams);
  END IF;

  -- Total cost = cost + fees + tax + shipping
  v_total_cost := p_cost_cents + v_fees + v_tax + v_shipping;

  -- Profit = selling price - total cost
  v_profit_cents := p_selling_price_cents - v_total_cost;

  -- Margin = (profit / selling price) * 100
  IF p_selling_price_cents > 0 THEN
    v_margin_percent := (v_profit_cents::NUMERIC / p_selling_price_cents::NUMERIC) * 100;
  ELSE
    v_margin_percent := 0;
  END IF;

  RETURN v_margin_percent;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Seed Default Fee Structures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

INSERT INTO fee_structures (marketplace, fee_type, fee_name, fee_formula, fixed_amount_cents, percentage_rate)
VALUES
  ('ebay', 'listing', 'Insertion Fee', 'fixed', 0, 0),
  ('ebay', 'final_value', 'Final Value Fee', 'percentage', 0, 0.1300),
  ('ebay', 'payment', 'Payment Processing', 'percentage', 30, 0.0299)
ON CONFLICT DO NOTHING;

-- Seed default tax rates
INSERT INTO tax_jurisdictions (country_code, state_code, tax_rate)
VALUES
  ('US', NULL, 0.0000),
  ('GB', NULL, 0.2000),
  ('CA', NULL, 0.0500)
ON CONFLICT DO NOTHING;
