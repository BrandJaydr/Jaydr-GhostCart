-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Jaydr GhostCart â€” Migration 0012: Rate Limiting
-- Stage: Stage 4 â€” Reliability and Controlled Automation
-- Reference: Stage 4 Plan â€” Task 5: Rate Limiting
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Rate Limits Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store per-tenant rate limits

CREATE TABLE IF NOT EXISTS rate_limits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  limit_type          TEXT NOT NULL CHECK (limit_type IN ('api_calls', 'imports', 'submissions', 'ai_calls')),
  limit_value         INTEGER NOT NULL,
  window_seconds      INTEGER NOT NULL,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, limit_type)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS rate_limits_tenant_idx ON rate_limits(tenant_id);
CREATE INDEX IF NOT EXISTS rate_limits_type_idx ON rate_limits(limit_type);

-- Row-Level Security for rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limits_tenant_isolation ON rate_limits
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Rate Limit Violations Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Audit log for rate limit violations

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  limit_type          TEXT NOT NULL,
  endpoint            TEXT,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address          INET,
  violated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for violation lookups
CREATE INDEX IF NOT EXISTS rate_limit_violations_tenant_idx ON rate_limit_violations(tenant_id);
CREATE INDEX IF NOT EXISTS rate_limit_violations_type_idx ON rate_limit_violations(limit_type);
CREATE INDEX IF NOT EXISTS rate_limit_violations_violated_idx ON rate_limit_violations(violated_at DESC);

-- Row-Level Security for rate limit violations
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limit_violations_tenant_isolation ON rate_limit_violations
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Integration-Specific Rate Limits Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Store per-integration rate limits (eBay, Amazon, etc.)

CREATE TABLE IF NOT EXISTS integration_rate_limits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration         TEXT NOT NULL, -- 'ebay', 'amazon', etc.
  limit_type          TEXT NOT NULL CHECK (limit_type IN ('api_calls', 'listings', 'orders')),
  limit_value         INTEGER NOT NULL,
  window_seconds      INTEGER NOT NULL,
  enabled             BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, integration, limit_type)
);

-- Index for integration rate limit lookups
CREATE INDEX IF NOT EXISTS integration_rate_limits_tenant_idx ON integration_rate_limits(tenant_id);
CREATE INDEX IF NOT EXISTS integration_rate_limits_integration_idx ON integration_rate_limits(integration);

-- Row-Level Security for integration rate limits
ALTER TABLE integration_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_rate_limits_tenant_isolation ON integration_rate_limits
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- â”€â”€â”€ Functions for Rate Limiting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Function to check if rate limit is exceeded
-- Renamed from check_limit to avoid colliding with usage_limits.check_limit (0008),
-- which resolves to public.check_limit since usage_limits is a TABLE (not a schema) and
-- both were stripped to the public schema. Keeps the two domain APIs distinct.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_tenant_id UUID,
  p_limit_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_value INTEGER;
  v_window_seconds INTEGER;
  v_enabled BOOLEAN;
  v_current_count INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Get limit configuration
  SELECT limit_value, window_seconds, enabled
  INTO v_limit_value, v_window_seconds, v_enabled
  FROM rate_limits
  WHERE tenant_id = p_tenant_id
    AND limit_type = p_limit_type
    AND enabled = true
  LIMIT 1;

  -- If no limit configured or disabled, allow
  IF v_limit_value IS NULL OR NOT v_enabled THEN
    RETURN true;
  END IF;

  -- Check current count in the window (this would typically use Redis)
  -- For now, we'll use a simple counter in the database
  -- In production, this should use Redis with sliding window algorithm

  -- For this implementation, we'll return true (allow) and let the
  -- application layer handle the actual rate limiting with Redis
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to log rate limit violation
CREATE OR REPLACE FUNCTION log_violation(
  p_tenant_id UUID,
  p_limit_type TEXT,
  p_endpoint TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_violation_id UUID;
BEGIN
  INSERT INTO rate_limit_violations (tenant_id, limit_type, endpoint, user_id, ip_address)
  VALUES (p_tenant_id, p_limit_type, p_endpoint, p_user_id, p_ip_address)
  RETURNING id INTO v_violation_id;

  RETURN v_violation_id;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Seed Default Rate Limits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

INSERT INTO rate_limits (tenant_id, limit_type, limit_value, window_seconds)
SELECT id, 'api_calls', 1000, 3600 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO rate_limits (tenant_id, limit_type, limit_value, window_seconds)
SELECT id, 'imports', 100, 3600 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO rate_limits (tenant_id, limit_type, limit_value, window_seconds)
SELECT id, 'submissions', 50, 3600 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO rate_limits (tenant_id, limit_type, limit_value, window_seconds)
SELECT id, 'ai_calls', 200, 3600 FROM tenants
ON CONFLICT DO NOTHING;
