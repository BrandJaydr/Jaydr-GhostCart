/**
 * Rate Limiting Middleware
 *
 * Express/Next.js middleware for rate limiting API requests.
 *
 * @agent:oracle Add tests for rate limiting middleware
 */

import type { NextRequest } from 'next/server';
import { checkTenantRateLimit, logRateLimitViolation } from '@/lib/rate-limiter';
import { apiError } from '@/lib/api/response';

export interface RateLimitOptions {
  limitType: string;
  getTenantId: (req: NextRequest) => string;
  getUserId?: (req: NextRequest) => string;
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; response?: Response }> {
  const { limitType, getTenantId, getUserId } = options;

  try {
    const tenantId = getTenantId(req);
    const userId = getUserId?.(req);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const result = await checkTenantRateLimit(tenantId, limitType);

    if (!result.allowed) {
      // Log violation
      await logRateLimitViolation(
        tenantId,
        limitType,
        req.url,
        userId,
        ipAddress,
      );

      const response = apiError(
        'Rate limit exceeded',
        {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
        429,
      );

      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

      return { allowed: false, response };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[rate-limit-middleware] error:', err);
    // Fail open on errors
    return { allowed: true };
  }
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: { limit: number; remaining: number; resetAt: Date },
): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());
}
