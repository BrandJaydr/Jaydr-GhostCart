-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Jaydr GhostCart â€” Migration 0013: Dashboard Views
-- Stage: Stage 4 â€” Reliability and Controlled Automation
-- Reference: Stage 4 Plan â€” Task 4: Operational Dashboards
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€â”€ Import Success Metrics View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Materialized view for import success/failure rates

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_import_metrics AS
SELECT
  tenant_id,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_imports,
  COUNT(*) FILTER (WHERE action = 'product.imported') as successful_imports,
  COUNT(*) FILTER (WHERE action = 'product.import_failed') as failed_imports,
  ROUND(
    (COUNT(*) FILTER (WHERE action = 'product.imported')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as success_rate_percent
FROM audit_events
WHERE action IN ('product.imported', 'product.import_failed')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_import_metrics_idx ON dashboard_import_metrics(tenant_id, date);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_import_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_import_metrics;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Listings by State View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Materialized view for listing state distribution

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_listing_states AS
SELECT
  tenant_id,
  state,
  COUNT(*) as count,
  ROUND(
        (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM listings l2 WHERE l2.tenant_id = listings.tenant_id), 0)) * 100,
    2
  ) as percentage
FROM listings
GROUP BY tenant_id, state;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_listing_states_idx ON dashboard_listing_states(tenant_id, state);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_listing_states()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_listing_states;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Job Failures View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Materialized view for job failure analysis

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_job_failures AS
SELECT
  tenant_id,
  type,
  error_category,
  COUNT(*) as failure_count,
  ROUND(
        (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM jobs j2 WHERE j2.tenant_id = jobs.tenant_id AND j2.status = 'failed'), 0)) * 100,
    2
  ) as percentage
FROM jobs
WHERE status = 'failed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, type, error_category;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_job_failures_idx ON dashboard_job_failures(tenant_id, type, error_category);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_job_failures()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_job_failures;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Margin Analysis View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Materialized view for margin analysis

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_margin_analysis AS
SELECT
  tenant_id,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE calculated_margin_percent IS NOT NULL) as listings_with_margin,
  ROUND(AVG(calculated_margin_percent), 2) as average_margin_percent,
  MIN(calculated_margin_percent) as min_margin_percent,
  MAX(calculated_margin_percent) as max_margin_percent,
  COUNT(*) FILTER (WHERE calculated_margin_percent < 10) as low_margin_count,
  COUNT(*) FILTER (WHERE calculated_margin_percent BETWEEN 10 AND 20) as medium_margin_count,
  COUNT(*) FILTER (WHERE calculated_margin_percent > 20) as high_margin_count
FROM listings
WHERE calculated_margin_percent IS NOT NULL
GROUP BY tenant_id;

CREATE UNIQUE INDEX IF NOT EXISTS dashboard_margin_analysis_idx ON dashboard_margin_analysis(tenant_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_margin_analysis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_margin_analysis;
END;
$$ LANGUAGE plpgsql;

-- â”€â”€â”€ Refresh All Dashboard Views Function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE OR REPLACE FUNCTION refresh_all()
RETURNS void AS $$
BEGIN
    PERFORM refresh_import_metrics();
  PERFORM refresh_listing_states();
  PERFORM refresh_job_failures();
  PERFORM refresh_margin_analysis();
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes (requires pg_cron extension)
-- SELECT cron.schedule('refresh-dashboard-views', '*/5 * * * *', 'SELECT dashboard.refresh_all()');
