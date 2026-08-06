import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Required from day one per Production Blueprint §3.3.
 * Returns system health status. Used by Docker health checks and uptime monitoring.
 *
 * TODO: @agent:scout (Stage 4) Expand to include db connectivity check and queue depth
 * TODO: @agent:scout (Stage 4) Add version, uptime, and correlation ID to response
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
