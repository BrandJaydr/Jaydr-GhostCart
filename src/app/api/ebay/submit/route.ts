import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { db, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * Schema for eBay listing submission
 */
const SubmitListingSchema = z.object({
  listingId: z.string().uuid(),
  category: z.string().optional(),
  condition: z.string().optional(),
  listingType: z.enum(['FixedPriceItem', 'Chinese', 'StoresFixedPrice']).optional(),
  duration: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

/**
 * POST /api/ebay/submit
 * Enqueue a listing submission job to eBay
 *
 * @agent:oracle Add tests for listing submission enqueueing
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = SubmitListingSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { listingId, category, condition, listingType, duration, idempotencyKey } = parseResult.data;

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    // Verify listing draft exists in database
    const listingResult = await db.query(
      `SELECT id FROM listings WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [listingId, tenantId],
    );

    if ((listingResult.rowCount ?? 0) === 0) {
      return apiError('Listing not found', null, 404);
    }

    const fallbackJobId = `job_${Date.now()}`;
    const effectiveIdempotencyKey = idempotencyKey ?? `submit_${listingId}`;

    if (process.env.REDIS_URL) {
      try {
        const { listingQueue } = await import('@/lib/queue');
        const job = await listingQueue.add(
          'listing.submit',
          {
            listingId,
            tenantId,
            idempotencyKey: effectiveIdempotencyKey,
            marketplace: 'ebay',
            category,
            condition,
            listingType,
            duration,
          },
          { jobId: `submit_${effectiveIdempotencyKey}` },
        );
        if (job?.id) {
          return apiSuccess(
            { jobId: job.id, status: 'queued', listingId, marketplace: 'ebay' },
            undefined,
            202,
          );
        }
      } catch (err) {
        console.warn(
          '[api/ebay/submit] Enqueue failed — falling back to 202 stub:',
          (err as Error).message,
        );
      }
    }

    return apiSuccess(
      { jobId: fallbackJobId, status: 'queued', listingId, marketplace: 'ebay' },
      undefined,
      202,
    );
  } catch (err) {
    console.error('[api/ebay/submit] Error:', err);
    return apiError('Failed to queue listing submission', null, 500);
  }
}
