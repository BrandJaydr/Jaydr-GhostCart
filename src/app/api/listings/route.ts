import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ListingListQuerySchema, ListingCreateSchema } from '@/lib/validation/schemas';
import type { ListingDraft } from '@/lib/types/canonical';

const mockListingDraft: ListingDraft = {
  id: 'lst_mock_123',
  tenantId: 'tenant_demo',
  productId: 'prod_mock_123',
  marketplace: 'ebay',
  state: 'draft',
  title: 'Wireless Ergonomic Keyboard',
  description: 'High quality ergonomic keyboard with long battery life.',
  attributes: { category: 'Electronics' },
  listPriceCents: 4999,
  currency: 'USD',
  shipping: { freeShipping: true },
  imageUrls: ['https://picsum.photos/600/400'],
  idempotencyKey: null,
  marketplaceListingId: null,
  lastError: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

  const { page, limit } = parseResult.data;

  return apiSuccess([mockListingDraft], { page, limit, total: 1 });
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

  const newDraft: ListingDraft = {
    ...mockListingDraft,
    id: `lst_${Date.now()}`,
    productId,
    marketplace,
    idempotencyKey: idempotencyKey ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return apiSuccess(newDraft, undefined, 201);
}
