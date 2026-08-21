import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db/index';
import { redis } from '@/lib/queue/index';
import { getCorrelationId } from '@/lib/logger';

const startedAt = Date.now();

/**
 * GET /api/health
 *
 * Required from day one per Production Blueprint §3.3.
 * Returns system health status. Used by Docker health checks and uptime monitoring.
 *
 * Stage 4/5: Expanded to check DB/Redis connectivity, uptime, version, and correlation ID.
 */
export async function GET(req?: NextRequest) {
  let dbStatus = 'down';
  let redisStatus = 'down';
  let hasError = false;

  try {
    const dbResult = await db.query('SELECT 1 as ok');
    if (dbResult.rowCount && dbResult.rows[0].ok === 1) {
      dbStatus = 'ok';
    }
  } catch (err) {
    hasError = true;
    dbStatus = `error: ${(err as Error).message}`;
  }

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      redisStatus = 'ok';
    }
  } catch (err) {
    hasError = true;
    redisStatus = `error: ${(err as Error).message}`;
  }

  const correlationId = getCorrelationId() ?? req?.headers.get('x-correlation-id') ?? undefined;

  const responseBody = {
    status: hasError ? 'degraded' : 'ok',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version ?? '0.1.1',
    correlationId,
    checks: {
      db: dbStatus,
      redis: redisStatus,
    },
  };

  return NextResponse.json(responseBody, { status: hasError ? 503 : 200 });
}
