/**
 * Rate Limiter
 *
 * Redis-based rate limiting with sliding window algorithm.
 * Supports per-tenant and per-integration rate limits.
 *
 * @agent:oracle Add tests for rate limiter
 */

import { redis } from '@/lib/queue/index';
import { db } from '@/lib/db/index';

export interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Check rate limit using Redis sliding window
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  window: number,
): Promise<RateLimitResult> {
  try {
    if (!redis) {
      // Redis not available - fail open
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + window * 1000),
        limit,
      };
    }

    const now = Date.now();
    const windowStart = now - window * 1000;

    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry
    pipeline.expire(key, window);

    const results = await pipeline.exec();

    if (!results) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + window * 1000),
        limit,
      };
    }

    const currentCount = (results[1][1] as number) || 0;
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    return {
      allowed,
      remaining,
      resetAt: new Date(windowStart + window * 1000),
      limit,
    };
  } catch (err) {
    console.error('[rate-limiter] checkRateLimit error:', err);
    // Fail open on Redis errors
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + window * 1000),
      limit,
    };
  }
}

/**
 * Get rate limit configuration from database
 */
export async function getRateLimitConfig(
  tenantId: string,
  limitType: string,
): Promise<RateLimitConfig | null> {
  try {
    const result = await db.query(
      `SELECT limit_value, window_seconds, enabled
       FROM rate_limits
       WHERE tenant_id = $1 AND limit_type = $2 AND enabled = true
       LIMIT 1`,
      [tenantId, limitType],
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      limit: row.limit_value,
      window: row.window_seconds,
    };
  } catch (err) {
    console.error('[rate-limiter] getRateLimitConfig error:', err);
    return null;
  }
}

/**
 * Get integration rate limit configuration
 */
export async function getIntegrationRateLimitConfig(
  tenantId: string,
  integration: string,
  limitType: string,
): Promise<RateLimitConfig | null> {
  try {
    const result = await db.query(
      `SELECT limit_value, window_seconds, enabled
       FROM integration_rate_limits
       WHERE tenant_id = $1 AND integration = $2 AND limit_type = $3 AND enabled = true
       LIMIT 1`,
      [tenantId, integration, limitType],
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      limit: row.limit_value,
      window: row.window_seconds,
    };
  } catch (err) {
    console.error('[rate-limiter] getIntegrationRateLimitConfig error:', err);
    return null;
  }
}

/**
 * Check rate limit for a tenant and limit type
 */
export async function checkTenantRateLimit(
  tenantId: string,
  limitType: string,
): Promise<RateLimitResult> {
  const config = await getRateLimitConfig(tenantId, limitType);

  if (!config) {
    // No limit configured - allow
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt: new Date(Date.now() + 3600000),
      limit: Number.MAX_SAFE_INTEGER,
    };
  }

  const key = `ratelimit:${tenantId}:${limitType}`;
  return checkRateLimit(key, config.limit, config.window);
}

/**
 * Check rate limit for an integration
 */
export async function checkIntegrationRateLimit(
  tenantId: string,
  integration: string,
  limitType: string,
): Promise<RateLimitResult> {
  const config = await getIntegrationRateLimitConfig(tenantId, integration, limitType);

  if (!config) {
    // No limit configured - allow
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt: new Date(Date.now() + 3600000),
      limit: Number.MAX_SAFE_INTEGER,
    };
  }

  const key = `ratelimit:${tenantId}:${integration}:${limitType}`;
  return checkRateLimit(key, config.limit, config.window);
}

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(
  tenantId: string,
  limitType: string,
  endpoint?: string,
  userId?: string,
  ipAddress?: string,
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO rate_limit_violations (tenant_id, limit_type, endpoint, user_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, limitType, endpoint || null, userId || null, ipAddress || null],
    );
  } catch (err) {
    console.error('[rate-limiter] logRateLimitViolation error:', err);
  }
}
