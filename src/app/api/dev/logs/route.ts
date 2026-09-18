import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withAuthRoute } from '@/lib/middleware/auth-guard';
import { getRecentLogs, type LogLevel } from '@/lib/logger';
import { z } from 'zod';

const LogsQuerySchema = z.object({
  level: z.enum(['all', 'debug', 'info', 'warn', 'error']).optional().default('all'),
  category: z.string().optional(),
  correlationId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  since: z.string().optional(),
});

/**
 * GET /api/dev/logs
 * Retrieve structured telemetry, scraper trace, and application logs for Developer Mode.
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  const url = new URL(req.url);
  const parsed = LogsQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return apiError('Invalid query parameters', parsed.error.flatten().fieldErrors, 400);
  }

  const { level, category, correlationId, search, limit, since } = parsed.data;
  const { tenantId } = actor;

  try {
    const logs = getRecentLogs({
      tenantId,
      level: level as LogLevel | 'all',
      category,
      correlationId,
      search,
      limit,
      since,
    });

    return apiSuccess({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return apiError('Failed to retrieve system logs', { error: (err as Error).message }, 500);
  }
});
