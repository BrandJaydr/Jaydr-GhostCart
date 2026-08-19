import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';
import { getProductPriceHistoryWithAnalytics } from '@/lib/products/price-history';

/**
 * GET /api/products/[id]/price-history
 *
 * Retrieves the chronological price change history and statistical fluctuation analytics
 * (volatility score, min/max/avg bands, trend direction, and detected patterns) for a product.
 */
export const GET = withAuthRoute<{ params: { id: string } }>(
  async (request: NextRequest, actor, context) => {
    try {
      requirePermission(actor, Permission.PRODUCTS_READ);

      const productId = context?.params?.id;
      if (!productId) {
        return apiError('Product ID is required', undefined, 400);
      }

      const result = await getProductPriceHistoryWithAnalytics(productId, actor.tenantId);

      return apiSuccess(result);
    } catch (err) {
      console.error('[API] GET /api/products/[id]/price-history error:', err);
      return apiError('Failed to fetch price history', (err as Error).message, 500);
    }
  },
);
