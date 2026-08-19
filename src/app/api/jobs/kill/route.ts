import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db/index';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * POST /api/jobs/kill
 * Kill all queued jobs for a tenant (emergency stop)
 *
 * @agent:oracle Add tests for kill switch
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.JOBS_WRITE);
  const tenantId = actor.tenantId;

  try {
    const result = await withTenant(tenantId, async (client) => {
      const killResult = await client.query(
        'SELECT jobs.kill_all_tenant_jobs($1, NULL) as killed',
        [tenantId],
      );

      const killedCount = parseInt(killResult.rows[0].killed as string, 10);

      // Log kill switch activation
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, $2, 'jobs.kill_switch', 'jobs', NULL, $3, now())`,
        [tenantId, actor.userId, JSON.stringify({ killedCount })],
      );

      return { killedCount };
    });

    return apiSuccess({
      message: `Killed ${result.killedCount} queued jobs`,
      killedCount: result.killedCount,
    });
  } catch (err) {
    console.error('[api/jobs/kill] Error:', err);
    return apiError('Failed to kill jobs', null, 500);
  }
});
