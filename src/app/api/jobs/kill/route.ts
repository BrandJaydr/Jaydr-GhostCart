import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db/index.js';

/**
 * POST /api/jobs/kill
 * Kill all queued jobs for a tenant (emergency stop)
 *
 * @agent:oracle Add tests for kill switch
 */
export async function POST(req: NextRequest) {
  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    const result = await db.query(
      'SELECT jobs.kill_all_tenant_jobs($1, NULL) as killed',
      [tenantId],
    );

    const killedCount = parseInt(result.rows[0].killed as string, 10);

    // Log kill switch activation
    await db.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'jobs.kill_switch', 'jobs', NULL, $2, now())`,
      [tenantId, JSON.stringify({ killedCount })],
    );

    return apiSuccess({
      message: `Killed ${killedCount} queued jobs`,
      killedCount,
    });
  } catch (err) {
    console.error('[api/jobs/kill] Error:', err);
    return apiError('Failed to kill jobs', null, 500);
  }
}
