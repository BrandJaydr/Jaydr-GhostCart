import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ListingListQuerySchema, ListingCreateSchema } from '@/lib/validation/schemas';
import type { ListingDraft } from '@/lib/types/canonical';
import { withTenant, DEV_TENANT_ID } from '@/lib/db';

/**
 * GET /api/listings
 * List listing drafts for the authenticated tenant.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parseResult = ListingListQuerySchema.safeParse(queryParams);
  if (!parseResult.success) {
    return apiError('Invalid query parameters', parseResult.error.flatten().fieldErrors, 400);
  }

  const { page, limit, state } = parseResult.data;
  const offset = (page - 1) * limit;

  try {
    const result = await withTenant<{ rows: ListingDraft[]; count: string }>(
      DEV_TENANT_ID,
      async (client) => {
        const whereClause = state ? 'WHERE state = $3' : '';
        const countQuery = `SELECT COUNT(*) FROM listing_drafts ${whereClause}`;
        const countResult = await client.query(countQuery, state ? [state] : []);

        const dataQuery = `
          SELECT id, tenant_id, product_id, marketplace, state, title, description,
                 list_price_cents, currency, attributes, shipping, image_urls,
                 idempotency_key, marketplace_listing_id, last_error,
                 created_at, updated_at
            FROM listing_drafts
           ${whereClause}
           ORDER BY updated_at DESC
           LIMIT $1 OFFSET $2
        `;
        const params = state ? [limit, offset, state] : [limit, offset];
        const dataResult = await client.query(dataQuery, params);

        const rows = dataResult.rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          productId: row.product_id,
          marketplace: row.marketplace,
          state: row.state,
          title: row.title,
          description: row.description,
          attributes: row.attributes ?? {},
          listPriceCents: row.list_price_cents,
          currency: row.currency,
          shipping: row.shipping ?? {},
          imageUrls: row.image_urls ?? [],
          idempotencyKey: row.idempotency_key,
          marketplaceListingId: row.marketplace_listing_id,
          lastError: row.last_error,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        return { rows, count: countResult.rows[0].count };
      },
    );

    return apiSuccess(result.rows, { page, limit, total: parseInt(result.count, 10) });
  } catch (err) {
    console.error('[API] GET /api/listings DB error:', (err as Error).message);
    return apiError('Failed to fetch listings', undefined, 500);
  }
}


/**
 * POST /api/listings
 * Create a new listing draft from a reviewed product.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = ListingCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { productId, marketplace, idempotencyKey } = parseResult.data;

  try {
    const draft = await withTenant<ListingDraft>(
      DEV_TENANT_ID,
      async (client) => {
        const id = `lst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();
        const key = idempotencyKey ?? null;

        await client.query(
          `INSERT INTO listing_drafts
             (id, tenant_id, product_id, marketplace, state, title, description,
              list_price_cents, currency, attributes, shipping, image_urls,
              idempotency_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'draft', '', '', NULL, 'USD', '{}'::jsonb,
                   '{}'::jsonb, ARRAY[]::text[], $5, $6, $7)
           ON CONFLICT (idempotency_key) DO UPDATE
             SET updated_at = EXCLUDED.updated_at
           RETURNING id, tenant_id, product_id, marketplace, state, title, description,
                     list_price_cents, currency, attributes, shipping, image_urls,
                     idempotency_key, marketplace_listing_id, last_error,
                     created_at, updated_at`,
          [id, DEV_TENANT_ID, productId, marketplace, key, now, now],
        );

        const row = (await client.query(
          `SELECT id, tenant_id, product_id, marketplace, state, title, description,
                  list_price_cents, currency, attributes, shipping, image_urls,
                  idempotency_key, marketplace_listing_id, last_error,
                  created_at, updated_at
             FROM listing_drafts
            WHERE id = $1`,
          [id],
        )).rows[0];

        return {
          id: row.id,
          tenantId: row.tenant_id,
          productId: row.product_id,
          marketplace: row.marketplace,
          state: row.state,
          title: row.title,
          description: row.description,
          attributes: row.attributes ?? {},
          listPriceCents: row.list_price_cents,
          currency: row.currency,
          shipping: row.shipping ?? {},
          imageUrls: row.image_urls ?? [],
          idempotencyKey: row.idempotency_key,
          marketplaceListingId: row.marketplace_listing_id,
          lastError: row.last_error,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      },
    );

    return apiSuccess(draft, undefined, 201);
  } catch (err) {
    console.error('[API] POST /api/listings DB error:', (err as Error).message);
    return apiError('Failed to create listing draft', undefined, 500);
  }
}
