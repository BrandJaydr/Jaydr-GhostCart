import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { db, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * Schema for activity history query
 */
const ActivityQuerySchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '50', 10)),
  jobType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/jobs/activity
 * Retrieve activity history for a tenant
 *
 * Queries audit_events and jobs tables for comprehensive activity history.
 *
 * @agent:oracle Add tests for activity history endpoint
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parseResult = ActivityQuerySchema.safeParse(queryParams);
  if (!parseResult.success) {
    return apiError('Invalid query parameters', parseResult.error.flatten().fieldErrors, 400);
  }

  const { page = 1, limit = 50, jobType, status, startDate, endDate } = parseResult.data;
  const offset = (page - 1) * limit;

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    // Build WHERE clause for filters
    const conditions: string[] = ['ae.tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (jobType) {
      conditions.push(`ae.action LIKE $${paramIndex}`);
      values.push(`%${jobType}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`j.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`ae.created_at >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`ae.created_at <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Query activity history (audit_events + jobs)
    const result = await db.query(
      `SELECT
        ae.id, ae.action, ae.entity_type, ae.entity_id, ae.metadata,
        ae.created_at, j.status, j.attempts, j.last_error, j.error_category
       FROM audit_events ae
       LEFT JOIN jobs j ON ae.metadata->>'bullJobId' = j.id::text
       WHERE ${whereClause}
       ORDER BY ae.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset],
    );

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM audit_events ae LEFT JOIN jobs j ON ae.metadata->>'bullJobId' = j.id::text WHERE ${whereClause}`,
      values,
    );

    const total = parseInt(countResult.rows[0].total as string, 10);

    const activities = result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      jobStatus: row.status,
      jobAttempts: row.attempts,
      lastError: row.last_error,
      errorCategory: row.error_category,
    }));

    return apiSuccess(activities, { page, limit, total });
  } catch (err) {
    console.error('[api/jobs/activity] Error:', err);
    return apiError('Failed to fetch activity history', null, 500);
  }
}
