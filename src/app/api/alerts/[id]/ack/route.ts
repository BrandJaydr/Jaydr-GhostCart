import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { acknowledge } from '@/lib/alerts/index';

/**
 * POST /api/alerts/[id]/ack
 * Mark an alert as acknowledged (backend-only; UI built by Prism team).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  try {
    const ok = await acknowledge(id);
    if (!ok) return apiError('Alert not found or already acknowledged', null, 404);
    return apiSuccess({ id, status: 'acknowledged' });
  } catch (err) {
    console.error('[api/alerts/ack] error:', (err as Error).message);
    return apiError('Failed to acknowledge alert', null, 500);
  }
}
