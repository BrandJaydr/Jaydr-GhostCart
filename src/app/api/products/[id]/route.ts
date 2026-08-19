import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db/index';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * GET /api/products/[id]
 * Retrieve a single product by ID with tenant isolation.
 *
 * @agent:oracle Add unit tests for this endpoint
 */
export const GET = withAuthRoute(
  async (req: NextRequest, actor, { params }: { params: { id: string } }) => {
    await requirePermission(actor, Permission.PRODUCTS_READ);
    const productId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return apiError('Invalid product ID format', null, 400);
    }

    const tenantId = actor.tenantId;

    try {
      const result = await withTenant(tenantId, (tx) =>
        tx.query(
          `SELECT
            p.id, p.tenant_id, p.title, p.description, p.identifiers, p.primary_image_url,
            p.additional_image_urls, p.supplier_price_cents, p.currency, p.availability,
            p.source_url, ps.supplier_id, p.confidence, p.imported_at, p.last_refreshed_at,
            p.review_status, p.import_duration_ms, p.normalization_completeness, p.user_corrections
           FROM products p
           LEFT JOIN product_sources ps ON ps.product_id = p.id
           WHERE p.id = $1 AND p.tenant_id = $2
           LIMIT 1`,
          [productId, tenantId],
        )
      );

      if (result.rowCount === 0) {
        return apiError('Product not found', null, 404);
      }

      const row = result.rows[0];
      const product = {
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
      };

      return apiSuccess(product);
    } catch (err) {
      console.error('[api/products/[id]] GET error:', err);
      return apiError('Failed to fetch product', null, 500);
    }
  }
);
