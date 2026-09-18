import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { setRepricingPause, isRepricingPaused } from '@/lib/repricing/engine';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * Schema for pause request
 */
const PauseSchema = z.object({
  paused: z.boolean(),
  reason: z.string().optional(),
});

/**
 * POST /api/repricing/pause
 * Set tenant-specific pause state (ERR-046: previously set GLOBAL pause for any
 * authenticated user; now scoped to the caller's tenant and owner/admin-only).
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.SETTINGS_WRITE);

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
  const { userId, tenantId } = actor;

  try {
    const success = await setRepricingPause(tenantId, paused, reason, userId);
    if (!success) {
      return apiError('Failed to set pause state', null, 500);
    }

    return apiSuccess({ paused, reason, scope: 'tenant' });
  } catch (err) {
    console.error('[api/repricing/pause] error:', err);
    return apiError('Failed to set pause state', null, 500);
  }
});

/**
 * GET /api/repricing/pause
 * Get current pause state for the caller's tenant (ERR-046: previously accepted
 * an arbitrary ?tenantId= for cross-tenant reads; now scoped to the actor).
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.SETTINGS_WRITE);
  const { tenantId } = actor;

  try {
    const paused = await isRepricingPaused(tenantId);

    return apiSuccess({ paused, scope: 'tenant' });
  } catch (err) {
    console.error('[api/repricing/pause] GET error:', err);
    return apiError('Failed to get pause state', null, 500);
  }
});
