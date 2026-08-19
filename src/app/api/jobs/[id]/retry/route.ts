import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db/index';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * POST /api/jobs/[id]/retry
 * Manually retry a failed job
 *
 * Resets job status to pending and attempt counter.
 *
 * @agent:oracle Add tests for manual retry
 */
export const POST = withAuthRoute(
  async (req: NextRequest, actor, { params }: { params: { id: string } }) => {
    await requirePermission(actor, Permission.JOBS_WRITE);
    const jobId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return apiError('Invalid job ID format', null, 400);
    }

    const tenantId = actor.tenantId;

    try {
      await withTenant(tenantId, async (client) => {
        // Check if job exists and belongs to tenant
        const checkResult = await client.query(
          'SELECT id, status, killed FROM jobs WHERE id = $1 LIMIT 1',
          [jobId],
        );

        if ((checkResult.rowCount ?? 0) === 0) {
          throw new Error('Job not found');
        }

        const job = checkResult.rows[0];

        if (job.killed) {
          throw new Error('Cannot retry a killed job');
        }

        // Reset job for retry
        await client.query(
          `UPDATE jobs
           SET status = 'pending',
               attempts = 0,
               last_error = NULL,
               next_retry_at = now(),
               error_category = NULL
           WHERE id = $1`,
          [jobId],
        );

        // Log manual retry
        await client.query(
          `INSERT INTO audit_events
             (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
           VALUES ($1, $2, 'job.retried', 'jobs', $3, $4, now())`,
          [tenantId, actor.userId, jobId, JSON.stringify({ manual: true })],
        );

        return { success: true };
      });

      return apiSuccess({
        jobId,
        message: 'Job queued for retry',
      });
    } catch (err) {
      console.error('[api/jobs/[id]/retry] Error:', err);

      if ((err as Error).message === 'Job not found') {
        return apiError('Job not found', null, 404);
      }

      if ((err as Error).message === 'Cannot retry a killed job') {
        return apiError('Cannot retry a killed job', null, 400);
      }

      return apiError('Failed to retry job', null, 500);
    }
  }
);
