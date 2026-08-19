/**
 * DELETE /api/auth/keys/[id]  — revoke an API key (soft-delete)
 * GET    /api/auth/keys/[id]  — get a single key's metadata
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { resolveActor } from '@/lib/middleware/resolve-actor';
import { withTenant } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const actor = await resolveActor(request);
  if (!actor) return apiError('Unauthorized', undefined, 401);

  const key = await withTenant(actor.tenantId, async (client) => {
    const result = await client.query<{
      id: string;
      key_prefix: string;
      label: string | null;
      scopes: string[];
      last_used_at: string | null;
      expires_at: string | null;
      created_at: string;
      revoked_at: string | null;
    }>(
      `SELECT id, key_prefix, label, scopes, last_used_at, expires_at, created_at, revoked_at
       FROM api_keys
       WHERE id = $1 AND user_id = $2`,
      [params.id, actor.userId],
    );
    return result.rows[0] ?? null;
  });

  if (!key) return apiError('Key not found', undefined, 404);
  return apiSuccess(key);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const actor = await resolveActor(request);
  if (!actor) return apiError('Unauthorized', undefined, 401);

  const revoked = await withTenant(actor.tenantId, async (client) => {
    const result = await client.query<{ id: string }>(
      `UPDATE api_keys
       SET revoked_at = now()
       WHERE id = $1
         AND user_id = $2
         AND revoked_at IS NULL
       RETURNING id`,
      [params.id, actor.userId],
    );
    return result.rows[0] ?? null;
  });

  if (!revoked) {
    return apiError('Key not found or already revoked', undefined, 404);
  }

  return apiSuccess({ id: revoked.id, revoked: true });
}
