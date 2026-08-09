import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db/index.js';

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics for a tenant
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  // @agent:forge Replace with session tenantId
  const tenantId = DEV_TENANT_ID;

  try {
    // Refresh dashboard views
    await db.query('SELECT dashboard.refresh_all()');

    // Get import metrics
    const importMetrics = await db.query(
      `SELECT date, total_imports, successful_imports, failed_imports, success_rate_percent
       FROM dashboard_import_metrics
       WHERE tenant_id = $1
       ORDER BY date DESC
       LIMIT 30`,
      [tenantId],
    );

    // Get listing states
    const listingStates = await db.query(
      `SELECT state, count, percentage
       FROM dashboard_listing_states
       WHERE tenant_id = $1`,
      [tenantId],
    );

    // Get job failures
    const jobFailures = await db.query(
      `SELECT type, error_category, failure_count, percentage
       FROM dashboard_job_failures
       WHERE tenant_id = $1`,
      [tenantId],
    );

    // Get margin analysis
    const marginAnalysis = await db.query(
      `SELECT total_listings, listings_with_margin, average_margin_percent,
              min_margin_percent, max_margin_percent,
              low_margin_count, medium_margin_count, high_margin_count
       FROM dashboard_margin_analysis
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const metrics = {
      imports: importMetrics.rows,
      listingStates: listingStates.rows,
      jobFailures: jobFailures.rows,
      marginAnalysis: marginAnalysis.rows[0] || null,
    };

    return apiSuccess(metrics);
  } catch (err) {
    console.error('[api/dashboard/metrics] error:', err);
    return apiError('Failed to fetch dashboard metrics', null, 500);
  }
}
