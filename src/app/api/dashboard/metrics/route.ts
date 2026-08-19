import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db/index';
import { withAuthRoute } from '@/lib/middleware/auth-guard';

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics for a tenant
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  const { tenantId } = actor;

  try {
    const metrics = await withTenant(tenantId, async (client) => {
      // Refresh dashboard views
      await client.query('SELECT refresh_all()');

      // Get import metrics
      const importMetrics = await client.query(
        `SELECT date, total_imports, successful_imports, failed_imports, success_rate_percent
         FROM dashboard_import_metrics
         WHERE tenant_id = $1
         ORDER BY date DESC
         LIMIT 30`,
        [tenantId],
      );

      // Get listing states
      const listingStates = await client.query(
        `SELECT state, count, percentage
         FROM dashboard_listing_states
         WHERE tenant_id = $1`,
         [tenantId],
      );

      // Get job failures
      const jobFailures = await client.query(
        `SELECT type, error_category, failure_count, percentage
         FROM dashboard_job_failures
         WHERE tenant_id = $1`,
         [tenantId],
      );

      // Get margin analysis
      const marginAnalysis = await client.query(
        `SELECT total_listings, listings_with_margin, average_margin_percent,
                min_margin_percent, max_margin_percent,
                low_margin_count, medium_margin_count, high_margin_count
         FROM dashboard_margin_analysis
         WHERE tenant_id = $1`,
         [tenantId],
      );

      return {
        imports: importMetrics.rows,
        listingStates: listingStates.rows,
        jobFailures: jobFailures.rows,
        marginAnalysis: marginAnalysis.rows[0] || null,
      };
    });

    return apiSuccess(metrics);
  } catch (err) {
    console.error('[api/dashboard/metrics] error:', err);
    return apiError('Failed to fetch dashboard metrics', null, 500);
  }
});
