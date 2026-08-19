import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withTenant } from '@/lib/db/index';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';

type ReviewStatusBody = {
  status: 'approved' | 'rejected';
};

const VALID_STATUSES = new Set(['approved', 'rejected']);

export const PATCH = withAuthRoute(
  async (req: NextRequest, actor, { params }: { params: { id: string } }) => {
    await requirePermission(actor, Permission.PRODUCTS_WRITE);
    const productId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return apiError('Invalid product ID format', null, 400);
    }

    let body: ReviewStatusBody;
    try {
      body = (await req.json()) as ReviewStatusBody;
    } catch {
      return apiError('Invalid JSON request body', null, 400);
    }

    if (!body.status || !VALID_STATUSES.has(body.status)) {
      return apiError(
        'Invalid review status. Must be "approved" or "rejected"',
        { validStatuses: Array.from(VALID_STATUSES) },
        400,
      );
    }

    const tenantId = actor.tenantId;
    const reviewedBy = actor.userId;

    try {
      // Check if product exists and belongs to tenant
      const productRes = await withTenant(tenantId, (tx) =>
        tx.query(
          'SELECT id, review_status FROM products WHERE id = $1 AND tenant_id = $2 LIMIT 1',
          [productId, tenantId],
        )
      );

      if (productRes.rowCount === 0) {
        return apiError('Product not found', null, 404);
      }

      const currentStatus = productRes.rows[0].review_status;

      // Use the database function for state transition with audit logging
      const result = await withTenant(tenantId, (tx) =>
        tx.query(
          'SELECT set_product_review_status($1, $2, $3) as success',
          [productId, body.status, reviewedBy],
        )
      );

      if (result.rows[0].success !== true) {
        return apiError('Failed to update review status', null, 500);
      }

      // Fetch updated product
      const updatedRes = await withTenant(tenantId, (tx) =>
        tx.query(
          `SELECT
            id, tenant_id, title, review_status, reviewed_at, reviewed_by
           FROM products
           WHERE id = $1 AND tenant_id = $2
           LIMIT 1`,
          [productId, tenantId],
        )
      );

      return apiSuccess({
        ...updatedRes.rows[0],
        previousStatus: currentStatus,
      });
    } catch (err) {
      console.error('[api/products/[id]/review-status] PATCH error:', err);
      return apiError('Failed to update review status', null, 500);
    }
  }
);
