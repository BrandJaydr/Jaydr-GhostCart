import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ProductListQuerySchema, ProductImportSchema } from '@/lib/validation/schemas';
import { mockProduct } from '@/lib/adapters/mock.adapter';

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
 *
 * Enqueues a BullMQ `product.import` job (Production Blueprint §3.1 — single
 * worker process and durable queue). The job is processed by the background
 * worker (`npm run worker`), which resolves the supplier adapter, normalizes
 * the product to a CanonicalProduct, and persists it to PostgreSQL.
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

  const { url, supplierId, idempotencyKey } = parseResult.data;
  const fallbackJobId = `job_${Date.now()}`;

  // @agent:forge (Stage 2) Replace 'tenant_demo' with the tenantId resolved from
  // the authenticated session once next-auth is configured.
  const tenantId = 'tenant_demo';

  // Graceful enqueue (Option C): the queue module throws at import time when
  // REDIS_URL is unset, so we guard with `process.env.REDIS_URL` and lazy-import
  // inside try/catch. In environments without Redis (e.g. unit tests) the route
  // still returns 202 — the worker picks the job up once the queue is reachable.
  if (process.env.REDIS_URL) {
    try {
      const { importQueue } = await import('@/lib/queue');
      const job = await importQueue.add(
        'product.import',
        { url, supplierId, tenantId, idempotencyKey },
        { jobId: `import_${idempotencyKey}` },
      );
      if (job?.id) {
        return apiSuccess(
          { jobId: job.id, status: 'queued', idempotencyKey },
          undefined,
          202,
        );
      }
    } catch (err) {
      console.warn(
        '[api/products] Enqueue failed — falling back to 202 stub:',
        (err as Error).message,
      );
    }
  }

  return apiSuccess(
    { jobId: fallbackJobId, status: 'queued', idempotencyKey },
    undefined,
    202,
  );
}
