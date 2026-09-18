import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api/response';
import { withAuthRoute, requirePermission, Permission } from '@/lib/middleware/auth-guard';
import { withTenant } from '@/lib/db';
import {
  AirtableOAuthClient,
  type AirtableOAuthConfig,
} from '@/lib/adapters/airtable/oauth-client';

/**
 * GET /api/airtable/callback
 *
 * Handles the Airtable OAuth redirect:
 *   1. Verifies `state` binds the response to the initiating tenant+user (CSRF).
 *   2. Exchanges the authorization `code` for an access + refresh token.
 *   3. Discovers the authorized base + first table (schema.bases:read scope).
 *   4. Persists the per-user connection in `airtable_connections` (RLS-scoped)
 *      and upserts the tenant's `airtable` supplier row with the discovered
 *      baseId/tableName so the import adapter can resolve them.
 *
 * Mirrors the eBay OAuth callback (src/app/api/ebay/authorize/route.ts GET).
 * NOTE: tokens are stored server-side; long-term AES-256/GCM at-rest encryption
 * of supplier config is tracked as a Stage 5 TODO (migration 0001 comment).
 */
export const GET = withAuthRoute(async (req: NextRequest, actor) => {
  await requirePermission(actor, Permission.SETTINGS_WRITE);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/import?airtable=error', req.url));
  }

  if (!code || !state) {
    return apiError('Missing authorization code or state parameter', null, 400);
  }

  // ── 1. Verify state (CSRF / session-hijack protection) ─────────────────────
  let decodedState: string | null = null;
  try {
    decodedState = Buffer.from(state, 'base64url').toString('utf8');
  } catch {
    decodedState = null;
  }
  const [stateTenantId, stateUserId] = decodedState?.split(':') ?? [];
  if (stateTenantId !== actor.tenantId || stateUserId !== actor.userId) {
    return apiError('Invalid state parameter', null, 400);
  }

  const config: AirtableOAuthConfig = {
    clientId: process.env.AIRTABLE_CLIENT_ID || '',
    clientSecret: process.env.AIRTABLE_CLIENT_SECRET || '',
    redirectUri: `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/airtable/callback`,
  };

  if (!config.clientId || !config.clientSecret) {
    return apiError('Airtable credentials not configured', null, 500);
  }

  try {
    const client = new AirtableOAuthClient(config);

    // ── 2. Exchange code for token ───────────────────────────────────────────
    const token = await client.exchangeCodeForToken(code);

    // ── 3. Discover authorized base + first table ────────────────────────────
    const bases = await client.listBases(token.accessToken);
    const baseId = bases[0]?.id ?? null;
    let tableName: string | null = null;
    if (baseId) {
      const tables = await client.listTables(token.accessToken, baseId);
      tableName = tables[0]?.name ?? null;
    }

    // ── 4. Persist per-user connection + supplier config ─────────────────────
    const connectionId = await withTenant(actor.tenantId, async (tx) => {
      const conn = await tx.query<{ id: string }>(
        `INSERT INTO airtable_connections
           (tenant_id, user_id, access_token, refresh_token, token_expires_at,
            base_id, scopes, connected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())
         ON CONFLICT (tenant_id, user_id) DO UPDATE
           SET access_token = EXCLUDED.access_token,
               refresh_token = EXCLUDED.refresh_token,
               token_expires_at = EXCLUDED.token_expires_at,
               base_id = EXCLUDED.base_id,
               scopes = EXCLUDED.scopes,
               connected_at = now()
         RETURNING id`,
        [
          actor.tenantId,
          actor.userId,
          token.accessToken,
          token.refreshToken,
          token.expiresAt.toISOString(),
          baseId,
          token.scope.split(' ').filter(Boolean),
        ],
      );

      // Upsert the tenant's airtable supplier row. On reconnect, preserve the
      // existing baseId/tableName when discovery returns null and never wipe an
      // existing fieldMapping (Postgres `||` with a null-valued key would
      // overwrite — jsonb_set + COALESCE guards that).
      await tx.query(
        `INSERT INTO suppliers (tenant_id, adapter_id, name, config)
         VALUES ($1, 'airtable', 'Airtable', $2::jsonb)
         ON CONFLICT (tenant_id, adapter_id) DO UPDATE
           SET config = jsonb_set(
                 jsonb_set(
                   suppliers.config,
                   '{baseId}',
                   COALESCE(to_jsonb($3::text), suppliers.config->'baseId'),
                   true
                 ),
                 '{tableName}',
                 COALESCE(to_jsonb($4::text), suppliers.config->'tableName'),
                 true
               )`,
        [
          actor.tenantId,
          JSON.stringify({ baseId, tableName, fieldMapping: {} }),
          baseId,
          tableName,
        ],
      );

      // Audit the successful connection.
      await tx.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, $2, 'airtable.authorized', 'supplier_connections', $3, $4, now())`,
        [
          actor.tenantId,
          actor.userId,
          conn.rows[0]?.id ?? null,
          JSON.stringify({ baseId, tableName }),
        ],
      );

      return conn.rows[0]?.id ?? null;
    });

    // Browser UX: return the user to the Import page with a status flag rather
    // than a JSON blob.
    return NextResponse.redirect(
      new URL(`/import?airtable=connected&connection=${connectionId ?? ''}`, req.url),
    );
  } catch (err) {
    // Re-connect errors land the user on the Import page with a visible flag.
    return NextResponse.redirect(
      new URL(
        `/import?airtable=error&reason=${encodeURIComponent(err instanceof Error ? err.message : 'unknown')}`,
        req.url,
      ),
    );
  }
});