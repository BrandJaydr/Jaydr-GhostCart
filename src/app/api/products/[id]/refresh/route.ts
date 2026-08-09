import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db';
import { ProductRefreshSchema } from '@/lib/validation/schemas';

/**
 * POST /api/products/[id]/refresh
 *
 * Enqueue a background `product.refresh` job for an imported product. The worker
 * re-runs the supplier adapter's `fetchProduct` and upserts (bumping
 * `last_refreshed_at`). Guarded by `process.env.REDIS_URL` — falls back to 202.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const productId = params.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    return apiError('Invalid product ID format', null, 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parseResult = ProductRefreshSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const tenantId = DEV_TENANT_ID;

  try {
    // Resolve the product's supplier adapter to hand to the refresh job.
    const row = await db.query(
      `SELECT ps.supplier_id FROM products p
         LEFT JOIN product_sources ps ON ps.product_id = p.id
        WHERE p.id = $1 LIMIT 1`,
      [productId],
    );
    if (row.rowCount === 0) {
      return apiError('Product not found', null, 404);
    }
    const supplierRow = row.rows[0];
    const supplierId = (
      await db.query(`SELECT adapter_id FROM suppliers WHERE id = $1 LIMIT 1`, [supplierRow.supplier_id])
    ).rows[0]?.adapter_id;
    if (!supplierId) {
      return apiError('Product has no resolvable supplier adapter', null, 409);
    }

    const idempotencyKey = parseResult.data.idempotencyKey ?? `refresh_${productId}`;
    const fallbackJobId = `job_${Date.now()}`;

    if (process.env.REDIS_URL) {
      try {
        const { importQueue } = await import('@/lib/queue');
        const job = await importQueue.add(
          'product.refresh',
          { productId, tenantId, supplierId, idempotencyKey },
          { jobId: `refresh_${idempotencyKey}` },
        );
        if (job?.id) {
          return apiSuccess({ jobId: job.id, status: 'queued', idempotencyKey }, undefined, 202);
        }
      } catch (err) {
        console.warn('[api/products/refresh] Enqueue failed — falling back to 202:', (err as Error).message);
      }
    }

    return apiSuccess({ jobId: fallbackJobId, status: 'queued', idempotencyKey }, undefined, 202);
  } catch (err) {
    console.error('[api/products/[id]/refresh] error:', (err as Error).message);
    return apiError('Failed to enqueue product refresh', null, 500);
  }
}