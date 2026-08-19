import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { calculateMargin, getFeeStructures } from '@/lib/margin/calculator';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * Schema for margin calculation request
 */
const MarginCalculationSchema = z.object({
  sellingPriceCents: z.number().int().positive(),
  costCents: z.number().int().nonnegative(),
  marketplace: z.string(),
  countryCode: z.string().default('US'),
  stateCode: z.string().nullable().default(null),
  tenantId: z.string().uuid().optional(),
  carrier: z.string().nullable().default(null),
  weightGrams: z.number().int().nullable().default(null),
});

/**
 * POST /api/listings/calculate-margin
 * Calculate margin for a listing with full cost breakdown
 */
export const POST = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_READ);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = MarginCalculationSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const input = parseResult.data;
  const tenantId = actor.tenantId;

  try {
    const marginResult = await calculateMargin({
      ...input,
      tenantId,
      stateCode: input.stateCode ?? undefined,
      carrier: input.carrier ?? undefined,
      weightGrams: input.weightGrams ?? undefined,
    });

    return apiSuccess(marginResult);
  } catch (err) {
    console.error('[api/listings/calculate-margin] error:', err);
    return apiError('Failed to calculate margin', null, 500);
  }
});

/**
 * GET /api/fee-structures (physically /api/listings/calculate-margin GET)
 * List fee structures for a marketplace
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.LISTINGS_READ);

  const url = new URL(req.url);
  const marketplace = url.searchParams.get('marketplace');

  if (!marketplace) {
    return apiError('Marketplace parameter is required', null, 400);
  }

  try {
    const feeStructures = await getFeeStructures(marketplace);

    return apiSuccess(feeStructures);
  } catch (err) {
    console.error('[api/fee-structures] error:', err);
    return apiError('Failed to fetch fee structures', null, 500);
  }
});
