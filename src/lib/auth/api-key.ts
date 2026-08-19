/**
 * API Key Authentication
 *
 * Verifies `Authorization: Bearer gc_<key>` headers for CLI and agentic access.
 * Raw keys are never stored — only a SHA-256 hex digest. Lookup is O(1) via
 * the unique index on api_keys.key_hash (migration 0016).
 *
 * Key format: `gc_<48 random hex chars>`
 * Example:    `gc_a3f1c2e9b04d7e8a1f5c3d2b6e9a0f4d1c8b3e7a2f0c5d9b6e1a4f8c2d7e0b3`
 *
 * @agent:forge Use resolveActor() instead of calling this directly from route handlers.
 */

import crypto from 'crypto';
import { db } from '@/lib/db';

export interface ApiKeyActor {
  userId: string;
  tenantId: string;
  keyId: string;
  scopes: string[];
  authMethod: 'api_key';
}

/** Minimum prefix length — shown to the user for identification */
const KEY_PREFIX_LEN = 8;

/**
 * Generates a new API key and returns both the raw token (shown ONCE to the
 * user) and the data to persist in the database.
 */
export function generateApiKey(): {
  rawToken: string;
  keyHash: string;
  keyPrefix: string;
} {
  const random = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const rawToken = `gc_${random}`;
  const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const keyPrefix = rawToken.slice(0, KEY_PREFIX_LEN);
  return { rawToken, keyHash, keyPrefix };
}

/**
 * Verifies an API key from a Bearer token string.
 * Updates last_used_at on success.
 * Returns null if the key is missing, revoked, expired, or invalid.
 */
export async function verifyApiKey(
  rawToken: string,
): Promise<ApiKeyActor | null> {
  if (!rawToken || !rawToken.startsWith('gc_')) return null;

  const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const result = await db.query<{
    id: string;
    user_id: string;
    tenant_id: string;
    scopes: string[];
    revoked_at: string | null;
    expires_at: string | null;
  }>(
    `SELECT id, user_id, tenant_id, scopes, revoked_at, expires_at
     FROM api_keys
     WHERE key_hash = $1
     LIMIT 1`,
    [keyHash],
  );

  const key = result.rows[0];
  if (!key) return null;

  // Key is revoked
  if (key.revoked_at) return null;

  // Key is expired
  if (key.expires_at && new Date(key.expires_at) < new Date()) return null;

  // Update last_used_at (fire-and-forget — don't block the request)
  db.query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [key.id]).catch(
    () => undefined,
  );

  return {
    userId: key.user_id,
    tenantId: key.tenant_id,
    keyId: key.id,
    scopes: key.scopes ?? [],
    authMethod: 'api_key',
  };
}

/**
 * Extracts the raw bearer token from a request's Authorization header.
 * Returns null if the header is absent or malformed.
 */
export function extractBearerToken(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}
