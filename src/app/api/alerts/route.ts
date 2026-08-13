import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db/index';
import { z } from 'zod';

/**
 * GET /api/alerts
 * List ops alert events for a tenant (backend-only; UI built by Prism team).
 * Query params: status, severity, limit (default 50), offset.
 */
const QuerySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return apiError('Invalid query parameters', parsed.error.flatten().fieldErrors, 400);
  }
  const { status, severity, limit, offset } = parsed.data;

  // @agent:forge replace with authenticated session tenant
  const tenantId = DEV_TENANT_ID;

  try {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let idx = 2;

    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (severity) {
      conditions.push(`severity = $${idx}`);
      values.push(severity);
      idx++;
    }

    const where = conditions.join(' AND ');
    const result = await db.query(
      `SELECT id, tenant_id, alert_type, severity, message, payload, channel, status, created_at, read_at
         FROM alert_events
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return apiSuccess(result.rows);
  } catch (err) {
    console.error('[api/alerts] GET error:', (err as Error).message);
    return apiError('Failed to fetch alerts', null, 500);
  }
}
