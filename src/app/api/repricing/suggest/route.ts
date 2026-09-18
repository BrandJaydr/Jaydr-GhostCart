import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import {
  generateSuggestion,
  getPendingSuggestions,
  isRepricingPaused,
} from '@/lib/repricing/engine';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * Schema for generating repricing suggestion
 */
const GenerateSuggestionSchema = z.object({
  listingId: z.string().uuid(),
  currentPriceCents: z.number().int().positive(),
  costCents: z.number().int().nonnegative(),
  competitorPriceCents: z.number().int().positive().optional(),
});

/**
 * POST /api/repricing/suggest
 * Generate a repricing suggestion
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_WRITE);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = GenerateSuggestionSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const input = parseResult.data;
  const { tenantId } = actor;

  // Check if repricing is paused
  const paused = await isRepricingPaused(tenantId);
  if (paused) {
    return apiError('Repricing is currently paused', null, 409);
  }

  try {
    const suggestionId = await generateSuggestion({
      tenantId,
      ...input,
    });

    if (!suggestionId) {
      return apiError('Failed to generate suggestion (no applicable rules)', null, 400);
    }

    return apiSuccess({ suggestionId });
  } catch (err) {
    console.error('[api/repricing/suggest] error:', err);
    return apiError('Failed to generate suggestion', null, 500);
  }
});

/**
 * GET /api/repricing/suggest
 * Get pending repricing suggestions
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_READ);
  const { tenantId } = actor;

  try {
    const suggestions = await getPendingSuggestions(tenantId);

    return apiSuccess(suggestions);
  } catch (err) {
    console.error('[api/repricing/suggest] GET error:', err);
    return apiError('Failed to fetch suggestions', null, 500);
  }
});
