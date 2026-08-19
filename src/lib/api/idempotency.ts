/**
 * Idempotency Helper — Stage 2
 *
 * Hybrid idempotency enforcement:
 *  1. API layer duplicate detection for fast UX feedback (409 Conflict).
 *  2. DB UNIQUE(source_url) constraint as the safety net.
 *
 * Reference: Production Blueprint §6.1 (idempotency keys)
 */

import { withTenant } from '@/lib/db/index';
import { createHash } from 'node:crypto';

/**
 * Check whether a product with the given source_url already exists for the tenant.
 *
 * Queries `products` under the tenant's RLS context.
 * This is a fast pre-enqueue guard; the DB unique constraint is the safety net.
 */
export async function checkDuplicateSourceUrl(
  tenantId: string,
  sourceUrl: string,
): Promise<boolean> {
  const result = await withTenant(tenantId, (tx) =>
    tx.query(
      'SELECT 1 FROM products WHERE tenant_id = $1 AND source_url = $2 LIMIT 1',
      [tenantId, sourceUrl],
    )
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Generate a deterministic idempotency key.
 *
 * Uses SHA-256 so the key is stable across retries for the same inputs.
 */
export function generateIdempotencyKey(
  operation: string,
  params: Record<string, unknown>,
): string {
  const digest = createHash('sha256')
    .update(JSON.stringify({ operation, params }))
    .digest('hex');
  return `${operation}:${digest}`;
}
