import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ListingUpdateSchema } from '@/lib/validation/schemas';
import { db, DEV_TENANT_ID, withTenant } from '@/lib/db/index';

/**
 * GET /api/listings/[id]
 * Retrieve a single listing draft by ID with tenant isolation.
 *
 * @agent:oracle Add unit tests for this endpoint
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const listingId = params.id;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(listingId)) {
    return apiError('Invalid listing ID format', null, 400);
  }

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    const result = await db.query(
      `SELECT
        id, tenant_id, product_id, marketplace, state, title, description,
        attributes, list_price_cents, currency, shipping, image_urls,
        idempotency_key, marketplace_listing_id, last_error, updated_at, created_at
       FROM listing_drafts
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [listingId, tenantId],
    );

    if (result.rowCount === 0) {
      return apiError('Listing not found', null, 404);
    }

    const row = result.rows[0];
    const listing = {
      id: row.id,
      tenantId: row.tenant_id,
      productId: row.product_id,
      marketplace: row.marketplace,
      state: row.state,
      title: row.title,
      description: row.description,
      attributes: row.attributes,
      listPriceCents: row.list_price_cents,
      currency: row.currency,
      shipping: row.shipping,
      imageUrls: row.image_urls,
      idempotencyKey: row.idempotency_key,
      marketplaceListingId: row.marketplace_listing_id,
      lastError: row.last_error,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };

    return apiSuccess(listing);
  } catch (err) {
    console.error('[api/listings/[id]] GET error:', err);
    return apiError('Failed to fetch listing', null, 500);
  }
}

/**
 * PUT /api/listings/[id]
 * Update a listing draft with partial updates and tenant isolation.
 *
 * Emits an audit event for the update.
 *
 * @agent:oracle Add unit tests for this endpoint
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const listingId = params.id;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(listingId)) {
    return apiError('Invalid listing ID format', null, 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = ListingUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const updates = parseResult.data;

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return apiError('No fields to update', null, 400);
  }

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    const updatedListing = await withTenant(tenantId, async (client) => {
      // Verify listing exists and belongs to tenant
      const checkResult = await client.query(
        'SELECT id FROM listing_drafts WHERE id = $1 LIMIT 1',
        [listingId],
      );

      if (checkResult.rowCount === 0) {
        throw new Error('Listing not found');
      }

      // Build dynamic SET clause
      const setClauses: string[] = [];
      const values: unknown[] = [listingId];
      let paramIndex = 2;

      const columnMap: Record<string, string> = {
        title: 'title',
        description: 'description',
        listPriceCents: 'list_price_cents',
        currency: 'currency',
        attributes: 'attributes',
        shipping: 'shipping',
        imageUrls: 'image_urls',
      };

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const column = columnMap[key];
          if (column) {
            setClauses.push(`${column} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
      }

      setClauses.push(`updated_at = now()`);

            const sql = `UPDATE listing_drafts SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
      const result = await client.query(sql, values);

      if (result.rowCount === 0) {
        throw new Error('Failed to update listing');
      }

      // Emit audit event
      await client.query(
        `INSERT INTO audit_events
          (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, NULL, 'listing.updated', 'listings', $2, $3, now())`,
        [tenantId, listingId, JSON.stringify(updates)],
      );

      return result.rows[0];
    });

    const row = updatedListing;
    const listing = {
      id: row.id,
      tenantId: row.tenant_id,
      productId: row.product_id,
      marketplace: row.marketplace,
      state: row.state,
      title: row.title,
      description: row.description,
      attributes: row.attributes,
      listPriceCents: row.list_price_cents,
      currency: row.currency,
      shipping: row.shipping,
      imageUrls: row.image_urls,
      idempotencyKey: row.idempotency_key,
      marketplaceListingId: row.marketplace_listing_id,
      lastError: row.last_error,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };

    return apiSuccess(listing);
  } catch (err) {
    if ((err as Error).message === 'Listing not found') {
      return apiError('Listing not found', null, 404);
    }
    console.error('[api/listings/[id]] PUT error:', err);
    return apiError('Failed to update listing', null, 500);
  }
}
