-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0008: Feature Flags System
-- Stage: Stage 3 — Controlled Beta Rollout
-- Reference: Stage 3 Testing & Beta Plan — Task 6: Controlled Beta
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Feature Flags Table ─────────────────────────────────────────────────────
-- Stores feature flags for gradual rollout

CREATE TABLE IF NOT EXISTS feature_flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  description         TEXT,
  enabled             BOOLEAN NOT NULL DEFAULT false,
  enabled_for_tenants UUID[] DEFAULT '{}', -- Specific tenants with access
  enabled_for_users   UUID[] DEFAULT '{}', -- Specific users with access
  rollout_percentage  INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for flag lookups
CREATE INDEX IF NOT EXISTS feature_flags_key_idx ON feature_flags(key);

-- ─── Beta Users Table ───────────────────────────────────────────────────────
-- Tracks beta program participants

CREATE TABLE IF NOT EXISTS beta_users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase               TEXT NOT NULL DEFAULT 'phase1' CHECK (phase IN ('phase1', 'phase2', 'phase3')),
  invited_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at         TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'removed')),
  feedback_count      INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Index for tenant/user lookups
CREATE INDEX IF NOT EXISTS beta_users_tenant_idx ON beta_users(tenant_id);
CREATE INDEX IF NOT EXISTS beta_users_status_idx ON beta_users(status);
CREATE INDEX IF NOT EXISTS beta_users_phase_idx ON beta_users(phase);

-- ─── Usage Limits Table ───────────────────────────────────────────────────────
-- Tracks per-tenant usage limits

CREATE TABLE IF NOT EXISTS usage_limits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  limit_type          TEXT NOT NULL CHECK (limit_type IN ('listings_per_day', 'ai_calls_per_day', 'storage_mb')),
  limit_value         INTEGER NOT NULL,
  current_value       INTEGER NOT NULL DEFAULT 0,
  reset_at            TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, limit_type)
);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS usage_limits_tenant_idx ON usage_limits(tenant_id);
CREATE INDEX IF NOT EXISTS usage_limits_reset_idx ON usage_limits(reset_at);

-- ─── Feedback Table ─────────────────────────────────────────────────────────
-- Stores beta user feedback

CREATE TABLE IF NOT EXISTS feedback (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category            TEXT NOT NULL CHECK (category IN ('bug', 'feature_request', 'improvement', 'other')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  priority            TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for category and status lookups
CREATE INDEX IF NOT EXISTS feedback_category_idx ON feedback(category);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);
CREATE INDEX IF NOT EXISTS feedback_tenant_idx ON feedback(tenant_id);

-- ─── Row-Level Security Policies ─────────────────────────────────────────────

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Feature flags are global (read-only for all)
CREATE POLICY feature_flags_global_read ON feature_flags
  FOR SELECT USING (true);

-- Tenants can see their own beta users
CREATE POLICY beta_users_tenant_isolation ON beta_users
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Tenants can see their own usage limits
CREATE POLICY usage_limits_tenant_isolation ON usage_limits
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- Tenants can see their own feedback
CREATE POLICY feedback_tenant_isolation ON feedback
  FOR ALL USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- ─── Functions for Feature Flags ───────────────────────────────────────────

-- Function to check if a flag is enabled for a tenant/user
CREATE OR REPLACE FUNCTION feature_flags.is_enabled(
  flag_key TEXT,
  tenant_id UUID,
  user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  is_enabled BOOLEAN := false;
BEGIN
  SELECT * INTO flag_record FROM feature_flags WHERE key = flag_key LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if globally enabled
  IF flag_record.enabled THEN
    -- Check tenant-specific access
    IF flag_record.enabled_for_tenants @> ARRAY[tenant_id] THEN
      RETURN true;
    END IF;

    -- Check user-specific access
    IF user_id IS NOT NULL AND flag_record.enabled_for_users @> ARRAY[user_id] THEN
      RETURN true;
    END IF;

    -- Check rollout percentage
    IF flag_record.rollout_percentage > 0 THEN
      -- Simple hash-based rollout (deterministic)
      IF (hashtext(tenant_id::text) % 100) < flag_record.rollout_percentage THEN
        RETURN true;
      END IF;
    END IF;

    -- If no specific restrictions and globally enabled, return true
    IF flag_record.enabled_for_tenants = '{}' AND flag_record.enabled_for_users = '{}' AND flag_record.rollout_percentage = 0 THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage limit
CREATE OR REPLACE FUNCTION usage_limits.check_limit(
  tenant_id UUID,
  limit_type TEXT,
  increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  limit_record RECORD;
  current_count INTEGER;
BEGIN
  SELECT * INTO limit_record FROM usage_limits
  WHERE tenant_id = tenant_id AND limit_type = limit_type
  LIMIT 1;

  IF NOT FOUND THEN
    -- Create default limit
    INSERT INTO usage_limits (tenant_id, limit_type, limit_value, current_value, reset_at)
    VALUES (
      tenant_id,
      limit_type,
      CASE limit_type
        WHEN 'listings_per_day' THEN 50
        WHEN 'ai_calls_per_day' THEN 100
        WHEN 'storage_mb' THEN 1000
        ELSE 100
      END,
      0,
      now() + interval '1 day'
    );
    RETURN true;
  END IF;

  -- Reset if past reset time
  IF now() > limit_record.reset_at THEN
    UPDATE usage_limits
    SET current_value = 0, reset_at = now() + interval '1 day'
    WHERE id = limit_record.id;
    current_count := 0;
  ELSE
    current_count := limit_record.current_value;
  END IF;

  -- Check if increment would exceed limit
  IF current_count + increment > limit_record.limit_value THEN
    RETURN false;
  END IF;

  -- Increment usage
  UPDATE usage_limits
  SET current_value = current_value + increment, updated_at = now()
  WHERE id = limit_record.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ─── Seed Default Feature Flags ───────────────────────────────────────────

INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
VALUES
  ('ai_rewrite_enabled', 'AI Rewrite', 'Enable AI-assisted listing rewrite', false, 0),
  ('ebay_integration_enabled', 'eBay Integration', 'Enable eBay marketplace integration', false, 0),
  ('beta_access_granted', 'Beta Access', 'Grant access to beta program', false, 0)
ON CONFLICT (key) DO NOTHING;
