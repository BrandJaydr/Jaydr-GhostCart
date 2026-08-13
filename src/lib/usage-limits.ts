/**
 * Usage Limits Enforcement
 *
 * Enforces per-tenant usage limits for listings, AI calls, and storage.
 */

import { db } from '@/lib/db/index';

export type LimitType = 'listings_per_day' | 'ai_calls_per_day' | 'storage_mb';

export interface UsageLimit {
  limitValue: number;
  currentValue: number;
  resetAt: Date;
}

/**
 * Check if a tenant has not exceeded their usage limit
 */
export async function checkUsageLimit(
  tenantId: string,
  limitType: LimitType,
  increment: number = 1,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    // Performance optimization: Combine check_limit call and usage fetch into single CTE
    // to reduce database round trips from 2 to 1
    const result = await db.query(
      `WITH limit_check AS (
        SELECT usage_limits.check_limit($1, $2, $3) as allowed
      ),
      current_usage AS (
        SELECT limit_value, current_value, reset_at
        FROM usage_limits
        WHERE tenant_id = $1 AND limit_type = $2
        LIMIT 1
      )
      SELECT lc.allowed, cu.limit_value, cu.current_value, cu.reset_at
      FROM limit_check lc
      LEFT JOIN current_usage cu ON true`,
      [tenantId, limitType, increment],
    );

    const allowed = (result.rows[0]?.allowed as boolean) ?? true;
    const limitRow = result.rows[0];

    let remaining = 0;
    let resetAt = new Date();

    if (limitRow && limitRow.limit_value !== null) {
      remaining = Math.max(0, limitRow.limit_value - limitRow.current_value - (allowed ? increment : 0));
      resetAt = limitRow.reset_at;
    }

    return { allowed, remaining, resetAt };
  } catch (err) {
    console.error('[usage-limits] checkUsageLimit error:', err);
    // Fail open - allow if check fails
    return { allowed: true, remaining: 100, resetAt: new Date() };
  }
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  tenantId: string,
  limitType: LimitType,
  increment: number = 1,
): Promise<void> {
  try {
    await db.query(
      'SELECT usage_limits.check_limit($1, $2, $3)',
      [tenantId, limitType, increment],
    );
  } catch (err) {
    console.error('[usage-limits] incrementUsage error:', err);
  }
}

/**
 * Get current usage for a tenant
 */
export async function getUsage(tenantId: string): Promise<Record<LimitType, UsageLimit>> {
  try {
    const result = await db.query(
      `SELECT limit_type, limit_value, current_value, reset_at
       FROM usage_limits
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const usage: Record<string, UsageLimit> = {};

    result.rows.forEach((row) => {
      usage[row.limit_type as LimitType] = {
        limitValue: row.limit_value,
        currentValue: row.current_value,
        resetAt: row.reset_at,
      };
    });

    return usage as Record<LimitType, UsageLimit>;
  } catch (err) {
    console.error('[usage-limits] getUsage error:', err);
    return {} as Record<LimitType, UsageLimit>;
  }
}
