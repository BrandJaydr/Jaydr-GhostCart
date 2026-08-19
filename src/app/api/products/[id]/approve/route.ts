import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db';
import type { ProductReviewStatus } from '@/lib/types/canonical';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

/**
 * POST /api/products/[id]/approve
 *
 * Move an imported product through the review-before-use gate: `pending_review` → `approved`.
 * This is an explicit merchant approval before a product may be used to create
 * listings (Production Blueprint §Stage 2 — review-first).
 *
 * 404 if the product is missing; 409 if the idempotency key already approved (idempotent).
 */
export const POST = withAuthRoute(
  async (req: NextRequest, actor, { params }: { params: { id: string } }) => {
    await requirePermission(actor, Permission.PRODUCTS_WRITE);
    const productId = params.id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return apiError('Invalid product ID format', null, 400);
    }

    const tenantId = actor.tenantId;

    try {
      const result = await withTenant<{ found: boolean; approved: boolean }>(
        tenantId,
        async (client) => {
          const row = await client.query(
            `UPDATE products SET review_status = 'approved'
              WHERE id = $1 AND review_status = 'pending_review'
              RETURNING id`,
            [productId],
          );
          if (row.rowCount === 0) {
            const exists = await client.query(
              `SELECT 1 FROM products WHERE id = $1 LIMIT 1`,
              [productId],
            );
            return { found: (exists.rowCount ?? 0) > 0, approved: false };
          }
          // Audit the approval.
          await client.query(
            `INSERT INTO audit_events
               (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
             VALUES ($1, $2, 'product.approved', 'products', $3, '{}'::jsonb, now())`,
            [tenantId, actor.userId, productId],
          );
          return { found: true, approved: true };
        },
      );

      if (!result.found) {
        return apiError('Product not found', null, 404);
      }

      const reviewStatus: ProductReviewStatus = 'approved';
      return apiSuccess({ id: productId, reviewStatus, approved: result.approved });
    } catch (err) {
      console.error('[API] POST /api/products/[id]/approve error:', (err as Error).message);
      return apiError('Failed to approve product', null, 500);
    }
  }
);
