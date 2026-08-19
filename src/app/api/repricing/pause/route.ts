import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { setRepricingPause, isRepricingPaused } from '@/lib/repricing/engine';
import { requireAuth } from '@/lib/middleware/auth-guard';

/**
 * Schema for pause request
 */
const PauseSchema = z.object({
  paused: z.boolean(),
  reason: z.string().optional(),
});

/**
 * POST /api/repricing/pause
 * Set global or tenant-specific pause state
 */
export async function POST(req: NextRequest) {
  const actor = await requireAuth(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = PauseSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { paused, reason } = parseResult.data;
  const { userId } = actor;

  try {
    const success = await setRepricingPause(null, paused, reason, userId);
    if (!success) {
      return apiError('Failed to set pause state', null, 500);
    }

    return apiSuccess({ paused, reason, scope: 'global' });
  } catch (err) {
    console.error('[api/repricing/pause] error:', err);
    return apiError('Failed to set pause state', null, 500);
  }
}

/**
 * GET /api/repricing/pause
 * Get current pause state
 */
export async function GET(req: NextRequest) {
  const actor = await requireAuth(req);

  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId');

  const effectiveTenantId = tenantId || null;

  try {
    const paused = await isRepricingPaused(effectiveTenantId || undefined);

    return apiSuccess({ paused, scope: effectiveTenantId ? 'tenant' : 'global' });
  } catch (err) {
    console.error('[api/repricing/pause] GET error:', err);
    return apiError('Failed to get pause state', null, 500);
  }
}
