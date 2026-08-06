import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ProductListQuerySchema, ProductImportSchema } from '@/lib/validation/schemas';
import { mockProduct } from '@/lib/adapters/mock';

/**
 * GET /api/products
 * List products for the authenticated tenant with pagination and filtering.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parseResult = ProductListQuerySchema.safeParse(queryParams);
  if (!parseResult.success) {
    return apiError('Invalid query parameters', parseResult.error.flatten().fieldErrors, 400);
  }

  const { page, limit } = parseResult.data;

  return apiSuccess([mockProduct], { page, limit, total: 1 });
}

/**
 * POST /api/products
 * Initiate a product import from an approved supplier.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = ProductImportSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { idempotencyKey } = parseResult.data;

  return apiSuccess(
    {
      jobId: `job_${Date.now()}`,
      status: 'queued',
      idempotencyKey,
    },
    undefined,
    202,
  );
}
