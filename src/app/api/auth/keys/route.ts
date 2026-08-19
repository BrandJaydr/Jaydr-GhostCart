/**
 * GET  /api/auth/keys  — list caller's API keys
 * POST /api/auth/keys  — create a new API key (raw token returned ONCE)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { resolveActor } from '@/lib/middleware/resolve-actor';
import { generateApiKey } from '@/lib/auth/api-key';
import { withTenant } from '@/lib/db';

export async function GET(request: NextRequest) {
  const actor = await resolveActor(request);
  if (!actor) return apiError('Unauthorized', undefined, 401);

  const keys = await withTenant(actor.tenantId, async (client) => {
    const result = await client.query<{
      id: string;
      key_prefix: string;
      label: string | null;
      scopes: string[];
      last_used_at: string | null;
      expires_at: string | null;
      created_at: string;
    }>(
      `SELECT id, key_prefix, label, scopes, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE user_id = $1
         AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [actor.userId],
    );
    return result.rows;
  });

  return apiSuccess(keys);
}

export async function POST(request: NextRequest) {
  const actor = await resolveActor(request);
  if (!actor) return apiError('Unauthorized', undefined, 401);

  let body: { label?: string; expiresInDays?: number } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — use defaults
  }

  const { rawToken, keyHash, keyPrefix } = generateApiKey();

  const expiresAt =
    body.expiresInDays != null
      ? new Date(Date.now() + body.expiresInDays * 86_400_000).toISOString()
      : null;

  const key = await withTenant(actor.tenantId, async (client) => {
    const result = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO api_keys (user_id, tenant_id, key_hash, key_prefix, label, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        actor.userId,
        actor.tenantId,
        keyHash,
        keyPrefix,
        body.label ?? null,
        expiresAt,
      ],
    );
    return result.rows[0];
  });

  return apiSuccess(
    {
      id: key.id,
      // Raw token is returned ONCE — never retrievable again
      token: rawToken,
      keyPrefix,
      label: body.label ?? null,
      expiresAt,
      createdAt: key.created_at,
      warning: 'Store this token now — it will not be shown again.',
    },
    undefined,
    201,
  );
}
