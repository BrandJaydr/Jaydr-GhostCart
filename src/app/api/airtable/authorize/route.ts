import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { apiSuccess, apiError } from '@/lib/api/response';
import { requireAuth, requirePermission, Permission } from '@/lib/middleware/auth-guard';
import { withTenant } from '@/lib/db';
import {
  AirtableOAuthClient,
  AIRTABLE_SCOPES,
  type AirtableOAuthConfig,
} from '@/lib/adapters/airtable/oauth-client';

/**
 * POST /api/airtable/authorize
 *
 * Initiate the "Sign in with Airtable" OAuth 2.0 flow.
 * Returns the Airtable authorization URL plus the CSRF-bound `state`.
 *
 * Mirrors the eBay OAuth flow (src/app/api/ebay/authorize/route.ts) but scoped
 * to the Airtable supplier adapter (suppliers.adapter_id = 'airtable').
 */
export async function POST(req: NextRequest) {
  const actor = await requireAuth(req);
  await requirePermission(actor, Permission.SETTINGS_WRITE);

  const config: AirtableOAuthConfig = {
    clientId: process.env.AIRTABLE_CLIENT_ID || '',
    clientSecret: process.env.AIRTABLE_CLIENT_SECRET || '',
    redirectUri: `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/airtable/callback`,
  };

  if (!config.clientId || !config.clientSecret) {
    return apiError(
      'Airtable credentials not configured',
      {
        hint: 'Set AIRTABLE_CLIENT_ID and AIRTABLE_CLIENT_SECRET, then register the redirect URI as {NEXTAUTH_URL}/api/airtable/callback in your Airtable OAuth app.',
      },
      500,
    );
  }

  // CSRF-protection token: tenant + user binding, CSPRNG nonce.
  const nonce = randomBytes(16).toString('hex');
  const state = Buffer.from(`${actor.tenantId}:${actor.userId}:${nonce}`).toString('base64url');

  const client = new AirtableOAuthClient(config);
  const authUrl = client.getAuthorizationUrl(state, AIRTABLE_SCOPES);

  // Audit the initiated flow (best-effort — never block the redirect on a DB issue).
  try {
    await withTenant(actor.tenantId, async (tx) => {
      await tx.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, $2, 'airtable.auth_initiated', 'supplier_connections', NULL, $3, now())`,
        [actor.tenantId, actor.userId, JSON.stringify({ scopes: AIRTABLE_SCOPES })],
      );
    });
  } catch {
    // Audit insert is best-effort; proceed with the authorization URL.
  }

  return apiSuccess({
    authUrl,
    state,
    redirectUri: config.redirectUri,
  });
}