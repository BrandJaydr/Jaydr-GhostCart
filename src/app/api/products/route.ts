import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { ProductListQuerySchema, ProductImportSchema } from '@/lib/validation/schemas';
import { withTenant } from '@/lib/db/index';
import { getAuthenticatedTenantId } from '@/lib/auth/tenant';
import { checkDuplicateSourceUrl } from '@/lib/api/idempotency';

/**
 * GET /api/products
 * List products for the authenticated tenant with pagination and filtering.
 */
export async function GET(req: NextRequest) {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) {
    return apiError('Authentication required', null, 401);
  }

  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  const parseResult = ProductListQuerySchema.safeParse(queryParams);
  if (!parseResult.success) {
    return apiError('Invalid query parameters', parseResult.error.flatten().fieldErrors, 400);
  }

  const { page, limit, supplierId } = parseResult.data;
  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause for optional filters
    const conditions: string[] = ['p.tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    // supplierId filters on the supplier adapter's row via product_sources link.
    if (supplierId) {
      conditions.push(`ps.supplier_id = $${paramIndex}`);
      values.push(supplierId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Performance optimization: Combine data query and count query into single CTE
    // to reduce database round trips from 2 to 1
    const result = await withTenant(tenantId, async (client) => client.query(
      `WITH product_data AS (
        SELECT
          p.id, p.tenant_id, p.title, p.description, p.identifiers, p.primary_image_url,
          p.additional_image_urls, p.supplier_price_cents, p.currency, p.availability,
          p.source_url, ps.supplier_id, p.confidence, p.imported_at, p.last_refreshed_at,
          p.review_status, p.import_duration_ms, p.normalization_completeness,
          p.user_corrections
         FROM products p
         LEFT JOIN product_sources ps ON ps.product_id = p.id
         WHERE ${whereClause}
         ORDER BY p.imported_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      ),
      total_count AS (
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN product_sources ps ON ps.product_id = p.id
        WHERE ${whereClause}
      )
      SELECT * FROM product_data, total_count`,
      [...values, limit, offset],
    ));

    const total = parseInt((result.rows[0]?.total ?? '0') as string, 10);

    const products = result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      title: row.title,
      description: row.description,
      identifiers: row.identifiers,
      primaryImageUrl: row.primary_image_url,
      additionalImageUrls: row.additional_image_urls,
      supplierPriceCents: row.supplier_price_cents,
      currency: row.currency,
      availability: row.availability,
      sourceUrl: row.source_url,
      supplierId: row.supplier_id,
      confidence: row.confidence,
      reviewStatus: row.review_status,
      importDurationMs: row.import_duration_ms,
      normalizationCompleteness: row.normalization_completeness,
      userCorrections: row.user_corrections ?? {},
      importedAt: row.imported_at,
      lastRefreshedAt: row.last_refreshed_at,
    }));

    return apiSuccess(products, { page, limit, total });
  } catch (err) {
    console.error('[api/products] GET error:', err);
    return apiError('Failed to fetch products', null, 500);
  }
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
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) {
    return apiError('Authentication required', null, 401);
  }

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

  // ── Idempotency guard (API layer) ──────────────────────────────────────────
  // Fast 409 feedback for duplicate source_url within this tenant.
  const isDuplicate = await checkDuplicateSourceUrl(tenantId, url);
  if (isDuplicate) {
    return apiError('Duplicate import', { sourceUrl: url }, 409);
  }

  // A successful response means BullMQ confirmed the job exists.
  // Never synthesize a job ID when Redis is absent or enqueueing fails.
  if (!process.env.REDIS_URL) {
    return apiError('Import queue unavailable', { hint: 'Configure Redis and retry.' }, 503);
  }

  try {
    const { importQueue } = await import('@/lib/queue');
    const jobOptions = idempotencyKey ? { jobId: `import_${idempotencyKey}` } : {};
    const job = await importQueue.add(
      'product.import',
      { url, supplierId, tenantId, idempotencyKey },
      jobOptions,
    );
    if (!job?.id) {
      return apiError('Failed to enqueue product import', null, 503);
    }

    return apiSuccess(
      { jobId: job.id, status: 'queued', idempotencyKey },
      undefined,
      202,
    );
  } catch (err) {
    console.error('[api/products] Failed to enqueue product import', (err as Error).name);
    return apiError('Failed to enqueue product import', null, 503);
  }
}
