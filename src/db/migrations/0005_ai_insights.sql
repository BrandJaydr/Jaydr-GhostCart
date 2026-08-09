-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0005: AI Insights Schema
-- Stage: Stage 3 — AI-Assisted Listing Generation and Sales Intelligence
-- Reference: Stage 3 Implementation Plan — Task 1: AI-Assisted Rewrite
-- ─────────────────────────────────────────────────────────────────────────────
-- @agent:archivist Add row-level security (RLS) policies on all AI tables
-- @agent:archivist Add indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- Create AI insights schema
CREATE SCHEMA IF NOT EXISTS ai_insights;

-- ─── AI Suggestions Cache ─────────────────────────────────────────────────────
-- Caches AI-generated responses with versioning for permanent storage
CREATE TABLE IF NOT EXISTS ai_insights.ai_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE CASCADE,
  listing_id          UUID REFERENCES listings(id) ON DELETE CASCADE,
  suggestion_type     TEXT NOT NULL, -- 'rewrite', 'analysis', 'keywords', etc.
  input_hash          TEXT NOT NULL, -- Hash of input for deduplication
  input_data          JSONB NOT NULL, -- Original input data
  output_data         JSONB NOT NULL, -- AI-generated output
  model_used          TEXT NOT NULL, -- AI model identifier
  version             INTEGER NOT NULL DEFAULT 1, -- Version for tracking changes
  cached_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ, -- For time-sensitive data
  is_valid            BOOLEAN NOT NULL DEFAULT true,
  metadata            JSONB, -- Additional metadata (tokens used, latency, etc.)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for tenant-scoped queries
CREATE INDEX IF NOT EXISTS ai_suggestions_tenant_idx ON ai_insights.ai_suggestions(tenant_id);
-- Index for input hash lookup (deduplication)
CREATE INDEX IF NOT EXISTS ai_suggestions_input_hash_idx ON ai_insights.ai_suggestions(input_hash);
-- Index for product/listing lookups
CREATE INDEX IF NOT EXISTS ai_suggestions_product_idx ON ai_insights.ai_suggestions(product_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_listing_idx ON ai_insights.ai_suggestions(listing_id);
-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS ai_suggestions_expires_at_idx ON ai_insights.ai_suggestions(expires_at) WHERE expires_at IS NOT NULL;

-- ─── Market Trends ───────────────────────────────────────────────────────────
-- Time-sensitive market data with versioning
CREATE TABLE IF NOT EXISTS ai_insights.market_trends (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,
  trend_type          TEXT NOT NULL, -- 'price', 'demand', 'competition', etc.
  trend_data          JSONB NOT NULL, -- Trend metrics and analysis
  confidence_score    NUMERIC(3,2), -- 0.00 to 1.00
  source              TEXT NOT NULL, -- 'ai_analysis', 'external_api', 'manual'
  effective_date      DATE NOT NULL, -- When this trend is effective
  expiry_date         DATE, -- When this trend expires
  is_seasonal         BOOLEAN NOT NULL DEFAULT false,
  seasonal_period     TEXT, -- 'holiday', 'black_friday', 'summer', etc.
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category and date range queries
CREATE INDEX IF NOT EXISTS market_trends_category_idx ON ai_insights.market_trends(category);
CREATE INDEX IF NOT EXISTS market_trends_date_idx ON ai_insights.market_trends(effective_date, expiry_date);
-- Index for seasonal queries
CREATE INDEX IF NOT EXISTS market_trends_seasonal_idx ON ai_insights.market_trends(is_seasonal, seasonal_period);

-- ─── Product Analysis ─────────────────────────────────────────────────────────
-- Material composition, quality assessment, and risk analysis
CREATE TABLE IF NOT EXISTS ai_insights.product_analysis (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_composition JSONB NOT NULL, -- Material breakdown with percentages
  quality_score       INTEGER NOT NULL CHECK (quality_score BETWEEN 0 AND 100),
  risk_assessment     JSONB NOT NULL, -- { level: 'low'|'medium'|'high', reasons: [] }
  market_potential    JSONB NOT NULL, -- { score, category, seasonalFactors: [] }
  analysis_version    INTEGER NOT NULL DEFAULT 1,
  confidence_score    NUMERIC(3,2),
  analyzed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, product_id, analysis_version)
);

-- Index for product lookups
CREATE INDEX IF NOT EXISTS product_analysis_product_idx ON ai_insights.product_analysis(product_id);
-- Index for quality score filtering
CREATE INDEX IF NOT EXISTS product_analysis_quality_idx ON ai_insights.product_analysis(quality_score);

-- ─── Seasonal Patterns ─────────────────────────────────────────────────────────
-- Holiday and seasonal event data for time-sensitive insights
CREATE TABLE IF NOT EXISTS ai_insights.seasonal_patterns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name        TEXT NOT NULL UNIQUE, -- 'black_friday', 'christmas', 'summer', etc.
  pattern_type        TEXT NOT NULL, -- 'holiday', 'season', 'event'
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  year                INTEGER NOT NULL,
  impact_categories   TEXT[] NOT NULL, -- Categories affected by this pattern
  expected_behaviors JSONB NOT NULL, -- Expected market behaviors
  recommendations     JSONB, -- AI-generated recommendations
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS seasonal_patterns_date_idx ON ai_insights.seasonal_patterns(start_date, end_date);
-- Index for pattern type queries
CREATE INDEX IF NOT EXISTS seasonal_patterns_type_idx ON ai_insights.seasonal_patterns(pattern_type);

-- ─── Row-Level Security Policies ─────────────────────────────────────────────
-- @agent:archivist Implement RLS policies for tenant isolation

ALTER TABLE ai_insights.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights.product_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights.seasonal_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can only see their own suggestions
CREATE POLICY ai_suggestions_tenant_isolation ON ai_insights.ai_suggestions
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Policy: Tenants can only see their own market trends
CREATE POLICY market_trends_tenant_isolation ON ai_insights.market_trends
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Policy: Tenants can only see their own product analysis
CREATE POLICY product_analysis_tenant_isolation ON ai_insights.product_analysis
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Seasonal patterns are global (no tenant isolation)
CREATE POLICY seasonal_patterns_global_read ON ai_insights.seasonal_patterns
  FOR SELECT USING (true);

-- ─── Functions for Cache Management ───────────────────────────────────────────

-- Function to clean up expired suggestions
CREATE OR REPLACE FUNCTION ai_insights.cleanup_expired_suggestions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_insights.ai_suggestions
  WHERE expires_at IS NOT NULL AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a cached suggestion
CREATE OR REPLACE FUNCTION ai_insights.get_or_create_suggestion(
  p_tenant_id UUID,
  p_product_id UUID,
  p_listing_id UUID,
  p_suggestion_type TEXT,
  p_input_hash TEXT,
  p_input_data JSONB,
  p_output_data JSONB,
  p_model_used TEXT
)
RETURNS UUID AS $$
DECLARE
  suggestion_id UUID;
BEGIN
  -- Try to find existing valid suggestion
  SELECT id INTO suggestion_id
  FROM ai_insights.ai_suggestions
  WHERE tenant_id = p_tenant_id
    AND input_hash = p_input_hash
    AND suggestion_type = p_suggestion_type
    AND (expires_at IS NULL OR expires_at > now())
    AND is_valid = true
  LIMIT 1;

  IF suggestion_id IS NOT NULL THEN
    RETURN suggestion_id;
  END IF;

  -- Create new suggestion
  INSERT INTO ai_insights.ai_suggestions (
    tenant_id, product_id, listing_id, suggestion_type,
    input_hash, input_data, output_data, model_used
  )
  VALUES (
    p_tenant_id, p_product_id, p_listing_id, p_suggestion_type,
    p_input_hash, p_input_data, p_output_data, p_model_used
  )
  RETURNING id INTO suggestion_id;

  RETURN suggestion_id;
END;
$$ LANGUAGE plpgsql;
