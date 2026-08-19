import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db';
import type { JobRecord } from '@/lib/types/canonical';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * GET /api/jobs/[id]
 *
 * Fetch a single background job record (tenant-scoped). Lets the frontend poll
 * import/refresh status without a live BullMQ connection.
 *
 * Reference: tasks/todo.md — "Feature improvements: Add job status polling
 * endpoint GET /api/jobs/[id]".
 */
export const GET = withAuthRoute(
  async (req: NextRequest, actor, { params }: { params: { id: string } }) => {
    await requirePermission(actor, Permission.JOBS_READ);
    const jobId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return apiError('Invalid job ID format', null, 400);
    }

    const tenantId = actor.tenantId;

    try {
      const job = await withTenant<JobRecord | null>(
        tenantId,
        async (client) => {
          const result = await client.query(
            `SELECT id, tenant_id, type, payload, idempotency_key, status, attempts,
                    last_error, created_at, completed_at
               FROM jobs
              WHERE id = $1 AND tenant_id = $2
              LIMIT 1`,
            [jobId, tenantId],
          );
          if (result.rowCount === 0) return null;
          const row = result.rows[0];
          return {
            id: row.id,
            tenantId: row.tenant_id,
            type: row.type,
            payload: row.payload ?? {},
            idempotencyKey: row.idempotency_key,
            status: row.status,
            attempts: row.attempts,
            lastError: row.last_error,
            createdAt: row.created_at,
            completedAt: row.completed_at,
          };
        },
      );

      if (!job) {
        return apiError('Job not found', null, 404);
      }

      return apiSuccess(job);
    } catch (err) {
      console.error('[API] GET /api/jobs/[id] error:', (err as Error).message);
      return apiError('Failed to fetch job', null, 500);
    }
  }
);