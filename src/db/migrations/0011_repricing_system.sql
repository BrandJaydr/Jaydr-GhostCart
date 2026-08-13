-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Jaydr GhostCart â€” Migration 0011: Repricing System
-- Stage: Stage 4 â€” Reliability and Controlled Automation
-- Reference: Stage 4 Plan â€” Task 3: Repricing Suggestions System
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Repricing Rules Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store per-tenant repricing rules

CREATE TABLE IF NOT EXISTS repricing_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name           TEXT NOT NULL,
  floor_price_cents   INTEGER NOT NULL,
  ceiling_price_cents INTEGER NOT NULL,
  margin_target_percent NUMERIC(5, 2) NOT NULL,
  beat_by_cents       INTEGER DEFAULT 0,
  beat_by_percent     NUMERIC(5, 4) DEFAULT 0,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, rule_name)
);

-- Index for repricing rules lookups
CREATE INDEX IF NOT EXISTS repricing_rules_tenant_idx ON repricing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS repricing_rules_enabled_idx ON repricing_rules(enabled) WHERE enabled = true;

-- Row-Level Security for repricing rules
ALTER TABLE repricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY repricing_rules_tenant_isolation ON repricing_rules
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Repricing Suggestions Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store generated repricing suggestions

CREATE TABLE IF NOT EXISTS repricing_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  current_price_cents INTEGER NOT NULL,
  suggested_price_cents INTEGER NOT NULL,
  reason              TEXT NOT NULL,
  competitor_price_cents INTEGER,
  current_margin_percent NUMERIC(5, 2),
  suggested_margin_percent NUMERIC(5, 2),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ DEFAULT now() + interval '24 hours',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for repricing suggestions lookups
CREATE INDEX IF NOT EXISTS repricing_suggestions_tenant_idx ON repricing_suggestions(tenant_id);
CREATE INDEX IF NOT EXISTS repricing_suggestions_listing_idx ON repricing_suggestions(listing_id);
CREATE INDEX IF NOT EXISTS repricing_suggestions_status_idx ON repricing_suggestions(status);
CREATE INDEX IF NOT EXISTS repricing_suggestions_expires_idx ON repricing_suggestions(expires_at) WHERE status = 'pending';

-- Row-Level Security for repricing suggestions
ALTER TABLE repricing_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY repricing_suggestions_tenant_isolation ON repricing_suggestions
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Repricing History Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Track applied repricing changes

CREATE TABLE IF NOT EXISTS repricing_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_price_cents     INTEGER NOT NULL,
  new_price_cents     INTEGER NOT NULL,
  change_cents       INTEGER GENERATED ALWAYS AS (new_price_cents - old_price_cents) STORED,
  change_percent      NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN old_price_cents > 0
      THEN ((new_price_cents::NUMERIC - old_price_cents::NUMERIC) / old_price_cents::NUMERIC) * 100
      ELSE NULL
    END
  ) STORED,
  old_margin_percent  NUMERIC(5, 2),
  new_margin_percent  NUMERIC(5, 2),
  triggered_by        TEXT NOT NULL CHECK (triggered_by IN ('manual', 'automatic', 'suggestion')),
  suggestion_id       UUID REFERENCES repricing_suggestions(id) ON DELETE SET NULL,
  applied_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for repricing history lookups
CREATE INDEX IF NOT EXISTS repricing_history_tenant_idx ON repricing_history(tenant_id);
CREATE INDEX IF NOT EXISTS repricing_history_listing_idx ON repricing_history(listing_id);
CREATE INDEX IF NOT EXISTS repricing_history_applied_idx ON repricing_history(applied_at DESC);

-- Row-Level Security for repricing history
ALTER TABLE repricing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY repricing_history_tenant_isolation ON repricing_history
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Global Repricing Pause Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store global pause state for repricing

CREATE TABLE IF NOT EXISTS repricing_pause (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global pause
  paused              BOOLEAN NOT NULL DEFAULT false,
  paused_at           TIMESTAMPTZ,
  paused_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  reason              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for pause state lookups
CREATE INDEX IF NOT EXISTS repricing_pause_tenant_idx ON repricing_pause(tenant_id);

-- Row-Level Security for repricing pause
ALTER TABLE repricing_pause ENABLE ROW LEVEL SECURITY;

CREATE POLICY repricing_pause_global_read ON repricing_pause
  FOR SELECT USING (tenant_id IS NULL); -- Global pause is readable by all

CREATE POLICY repricing_pause_tenant_isolation ON repricing_pause
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid OR tenant_id IS NULL);

-- â”€â”€â”€ Functions for Repricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Function to check if repricing is paused
CREATE OR REPLACE FUNCTION is_paused(p_tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_global_paused BOOLEAN;
  v_tenant_paused BOOLEAN;
BEGIN
  -- Check global pause
  SELECT paused INTO v_global_paused
  FROM repricing_pause
  WHERE tenant_id IS NULL
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_global_paused = true THEN
    RETURN true;
  END IF;

  -- Check tenant-specific pause
  IF p_tenant_id IS NOT NULL THEN
    SELECT paused INTO v_tenant_paused
    FROM repricing_pause
    WHERE tenant_id = p_tenant_id
    ORDER BY updated_at DESC
    LIMIT 1;

    IF v_tenant_paused = true THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to set pause state
CREATE OR REPLACE FUNCTION set_pause(
  p_paused BOOLEAN,
  p_tenant_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO repricing_pause (tenant_id, paused, paused_at, paused_by, reason)
  VALUES (p_tenant_id, p_paused, CASE WHEN p_paused THEN now() ELSE NULL END, p_user_id, p_reason);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to generate repricing suggestion
CREATE OR REPLACE FUNCTION generate_suggestion(
  p_tenant_id UUID,
  p_listing_id UUID,
  p_current_price_cents INTEGER,
  p_cost_cents INTEGER,
  p_competitor_price_cents INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_suggested_price INTEGER;
  v_suggestion_id UUID;
  v_current_margin NUMERIC(5, 2);
  v_suggested_margin NUMERIC(5, 2);
  v_reason TEXT;
BEGIN
  -- Get current margin
  v_current_margin := ((p_current_price_cents::NUMERIC - p_cost_cents::NUMERIC) / p_current_price_cents::NUMERIC) * 100;

  -- Get applicable repricing rule
  SELECT * INTO v_rule
  FROM repricing_rules
  WHERE tenant_id = p_tenant_id
    AND enabled = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    -- No rule configured, no suggestion
    RETURN NULL;
  END IF;

  -- Calculate suggested price based on rules
  IF p_competitor_price_cents IS NOT NULL THEN
    -- Beat competitor by configured amount
    IF v_rule.beat_by_cents > 0 THEN
      v_suggested_price := p_competitor_price_cents - v_rule.beat_by_cents;
    ELSIF v_rule.beat_by_percent > 0 THEN
      v_suggested_price := FLOOR(p_competitor_price_cents * (1 - v_rule.beat_by_percent));
    ELSE
      v_suggested_price := p_competitor_price_cents - 1; -- Default: beat by $0.01
    END IF;
  ELSE
    -- No competitor data, use margin target
    v_suggested_price := FLOOR(p_cost_cents / (1 - v_rule.margin_target_percent / 100));
  END IF;

  -- Apply floor/ceiling constraints
  IF v_suggested_price < v_rule.floor_price_cents THEN
    v_suggested_price := v_rule.floor_price_cents;
    v_reason := 'Applied floor price constraint';
  ELSIF v_suggested_price > v_rule.ceiling_price_cents THEN
    v_suggested_price := v_rule.ceiling_price_cents;
    v_reason := 'Applied ceiling price constraint';
  ELSE
    v_reason := 'Based on competitor pricing and margin target';
  END IF;

  -- Calculate suggested margin
  v_suggested_margin := ((v_suggested_price::NUMERIC - p_cost_cents::NUMERIC) / v_suggested_price::NUMERIC) * 100;

  -- Create suggestion
  INSERT INTO repricing_suggestions (
    tenant_id, listing_id, current_price_cents, suggested_price_cents,
    reason, competitor_price_cents, current_margin_percent, suggested_margin_percent
  )
  VALUES (
    p_tenant_id, p_listing_id, p_current_price_cents, v_suggested_price,
    v_reason, p_competitor_price_cents, v_current_margin, v_suggested_margin
  )
  RETURNING id INTO v_suggestion_id;

  RETURN v_suggestion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply repricing
CREATE OR REPLACE FUNCTION apply_suggestion(
  p_suggestion_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_suggestion RECORD;
  v_old_margin NUMERIC(5, 2);
  v_new_margin NUMERIC(5, 2);
BEGIN
  -- Get suggestion details
  SELECT * INTO v_suggestion
  FROM repricing_suggestions
  WHERE id = p_suggestion_id AND status = 'approved'
  LIMIT 1;

  IF v_suggestion IS NULL THEN
    RAISE EXCEPTION 'Suggestion not found or not approved';
  END IF;

  -- Calculate margins
  v_old_margin := v_suggestion.current_margin_percent;
  v_new_margin := v_suggestion.suggested_margin_percent;

  -- Update listing price
  UPDATE listings
  SET list_price_cents = v_suggestion.suggested_price_cents,
      updated_at = now()
  WHERE id = v_suggestion.listing_id;

  -- Record in history
  INSERT INTO repricing_history (
    tenant_id, listing_id, old_price_cents, new_price_cents,
    old_margin_percent, new_margin_percent, triggered_by, suggestion_id
  )
  VALUES (
    v_suggestion.tenant_id, v_suggestion.listing_id,
    v_suggestion.current_price_cents, v_suggestion.suggested_price_cents,
    v_old_margin, v_new_margin, 'suggestion', p_suggestion_id
  );

  -- Update suggestion status
  UPDATE repricing_suggestions
  SET status = 'applied'
  WHERE id = p_suggestion_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
