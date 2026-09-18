-- Migration: 0021_system_logs.sql
-- Description: Structured system telemetry, scraper trace, and developer mode log storage

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    category VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast queries in the Developer Mode Logs console
CREATE INDEX IF NOT EXISTS idx_system_logs_tenant_timestamp ON system_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_correlation_id ON system_logs(correlation_id) WHERE correlation_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for multi-tenant isolation
CREATE POLICY system_logs_tenant_isolation ON system_logs
    FOR ALL
    TO ghostcart_app
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
