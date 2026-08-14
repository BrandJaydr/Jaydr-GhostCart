import type { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * PATCH /api/products/[id]/review-status
 *
 * Update the review status of a product (approve/reject).
 *
 * Body: { status: 'approved' | 'rejected' }
 *
 * - Uses the set_product_review_status function for audit logging
 * - Updates reviewed_at and reviewed_by fields
 * - Emits audit event for review state change
 *
 * Reference: Production Blueprint §6.2 (review-before-use state)
 */

type ReviewStatusBody = {
  status: 'approved' | 'rejected';
};

const VALID_STATUSES = new Set(['approved', 'rejected']);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
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

  // @agent:forge Replace with authenticated tenantId from session
  const tenantId = DEV_TENANT_ID;
  const reviewedBy = DEV_TENANT_ID; // In production, this would be the actual user ID

  try {
    // Check if product exists and belongs to tenant
    const productRes = await db.query(
      'SELECT id, review_status FROM products WHERE id = $1 AND tenant_id = $2 LIMIT 1',
      [productId, tenantId],
    );

    if (productRes.rowCount === 0) {
      return apiError('Product not found', null, 404);
    }

    const currentStatus = productRes.rows[0].review_status;

    // Use the database function for state transition with audit logging
    const result = await db.query(
      'SELECT set_product_review_status($1, $2, $3) as success',
      [productId, body.status, reviewedBy],
    );

    if (result.rows[0].success !== true) {
      return apiError('Failed to update review status', null, 500);
    }

    // Fetch updated product
    const updatedRes = await db.query(
      `SELECT
        id, tenant_id, title, review_status, reviewed_at, reviewed_by
       FROM products
       WHERE id = $1 AND tenant_id = $2
       LIMIT 1`,
      [productId, tenantId],
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
