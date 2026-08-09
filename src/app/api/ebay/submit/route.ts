import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { getEBayClient, type ListingItem } from '@/lib/adapters/ebay/ebay-client';
import { mapListingDraftToEBayListing, validateEBayListing } from '@/lib/adapters/ebay/listing-mapper';
import { db, DEV_TENANT_ID, withTenant } from '@/lib/db/index.js';

/**
 * Schema for eBay listing submission
 */
const SubmitListingSchema = z.object({
  listingId: z.string().uuid(),
  category: z.string().optional(),
  condition: z.string().optional(),
  listingType: z.enum(['FixedPriceItem', 'Chinese', 'StoresFixedPrice']).optional(),
  duration: z.string().optional(),
});

/**
 * POST /api/ebay/submit
 * Submit a listing draft to eBay
 *
 * @agent:oracle Add tests for listing submission
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

  const { listingId, category, condition, listingType, duration } = parseResult.data;

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    // Fetch listing draft from database
    const listingResult = await db.query(
      `SELECT id, title, description, list_price_cents, currency, image_urls
       FROM listings
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [listingId, tenantId],
    );

    if ((listingResult.rowCount ?? 0) === 0) {
      return apiError('Listing not found', null, 404);
    }

    const listingRow = listingResult.rows[0];
    const listingDraft = {
      title: listingRow.title,
      description: listingRow.description,
      listPriceCents: listingRow.list_price_cents,
      currency: listingRow.currency,
      imageUrls: listingRow.image_urls,
    };

    // Map to eBay format
    const ebayListing = mapListingDraftToEBayListing(listingDraft, {
      category,
      condition,
      listingType,
      duration,
    });

    // Validate eBay listing requirements
    const validation = validateEBayListing(ebayListing);
    if (!validation.valid) {
      return apiError('Listing validation failed', validation.errors, 400);
    }

    // Submit to eBay
    const ebayClient = getEBayClient();
    const ebayResponse = await ebayClient.addListing(ebayListing);

    // Update listing with eBay item ID
    await withTenant(tenantId, async (client) => {
      await client.query(
        `UPDATE listings
         SET marketplace_listing_id = $1,
             state = 'submitted',
             updated_at = now()
         WHERE id = $2`,
        [ebayResponse.itemId, listingId],
      );

      // Log submission
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, NULL, 'listing.submitted', 'listings', $2, $3, now())`,
        [
          tenantId,
          listingId,
          JSON.stringify({
            marketplace: 'ebay',
            itemId: ebayResponse.itemId,
            viewItemURL: ebayResponse.viewItemURL,
          }),
        ],
      );
    });

    return apiSuccess({
      listingId,
      ebayItemId: ebayResponse.itemId,
      viewItemURL: ebayResponse.viewItemURL,
      state: 'submitted',
    });
  } catch (err) {
    console.error('[api/ebay/submit] Error:', err);
    const errorMessage = (err as Error).message;

    // Provide helpful error messages
    if (errorMessage.includes('Missing eBay configuration')) {
      return apiError(
        'eBay not configured',
        { hint: 'Authorize eBay connection first' },
        400,
      );
    }

    if (errorMessage.includes('No token available')) {
      return apiError(
        'eBay authorization required',
        { hint: 'Authorize eBay connection first' },
        401,
      );
    }

    return apiError('Failed to submit listing to eBay', null, 500);
  }
}
