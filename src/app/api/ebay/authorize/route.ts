import type { NextRequest } from 'next/server';
import type { PoolClient } from 'pg';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { type eBayConfig, eBayClient } from '@/lib/adapters/ebay/ebay-client';
import { withTenant, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * Schema for eBay authorization request
 */
const AuthorizeSchema = z.object({
  environment: z.enum(['sandbox', 'production']).optional(),
});

/**
 * Maximum age of an OAuth state before it is considered stale. States are
 * short-lived by design: a stale state is worthless to an attacker and
 * signals a replay attempt.
 */
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Verify the OAuth state returned by eBay against the value stored at
 * authorize-initiation time.
 *
 * The callback previously only decoded the returned state and checked that
 * its tenant prefix matched the dev tenant UUID. A forged state carrying the
 * well-known dev UUID therefore passed. This compares the returned state to
 * the stored value and enforces freshness, failing closed on any mismatch.
 *
 * @returns true when the state is valid and fresh.
 */
async function verifyStoredState(client: PoolClient, tenantId: string, state: string): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT metadata->>'state' AS stored_state,
            created_at AS issued_at
       FROM audit_events
      WHERE tenant_id = $1
        AND action = 'ebay.auth_initiated'
        AND metadata->>'state' = $2
      ORDER BY created_at DESC
      LIMIT 1`,
    [tenantId, state],
  );

  if (rows.length === 0) {
    return false;
  }

  const row = rows[0] as { stored_state?: string; issued_at?: string };
  if (row.stored_state !== state) {
    return false;
  }

  const issuedAt = row.issued_at ? new Date(row.issued_at).getTime() : NaN;
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_MAX_AGE_MS) {
    return false;
  }

  return true;
}

/**
 * POST /api/ebay/authorize
 * Initiate eBay OAuth 2.0 authorization flow
 *
 * Returns the authorization URL where the user can grant consent.
 *
 * @agent:oracle Add tests for OAuth flow
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = AuthorizeSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { environment = 'sandbox' } = parseResult.data;

  // @agent:forge Replace with session tenantId
  const tenantId = DEV_TENANT_ID;

  try {
    // Load eBay config from environment variables
    const config: eBayConfig = {
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      ruName: process.env.EBAY_RU_NAME || '',
      environment,
    };

    if (!config.appId || !config.certId) {
      return apiError('EBAY_APP_ID or EBAY_CERT_ID environment variable not set', null, 400);
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(`${tenantId}:${Date.now()}`).toString('base64');

    // Create eBay client and get authorization URL
    const ebayClient = new eBayClient(config);
    const authUrl = ebayClient.getAuthorizationUrl(state);

    // Store state in database for verification (audit_events is immutable:
    // INSERT only, no UPDATE/DELETE — see migration 0003).
    //
    // All DB work runs inside withTenant so the `ghostcart.tenant_id` GUC is
    // set on the connection before RLS policies evaluate. Without it the
    // audit_events SELECT in verifyStoredState() sees no rows and every
    // legitimate callback 401s.
    try {
      await withTenant(tenantId, async (client: PoolClient) => {
        await client.query(
          `INSERT INTO audit_events
             (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
            VALUES ($1, NULL, 'ebay.auth_initiated', 'marketplace_connections', NULL, $2, now())`,
          [tenantId, JSON.stringify({ state, environment })],
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return apiError(`Failed to initiate authorization: ${message}`, null, 500);
    }

    return apiSuccess({ authorizationUrl: authUrl, state, expiresIn: 600 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError(`Failed to initiate authorization: ${message}`, null, 500);
  }
}

/**
 * GET /api/ebay/authorize
 * Handle OAuth callback from eBay
 *
 * Exchanges authorization code for access token.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return apiError(
      `OAuth error: ${error}`,
      { error_description: searchParams.get('error_description') },
      400,
    );
  }

  if (!code) {
    return apiError('Authorization code is required', null, 400);
  }

  if (!state) {
    return apiError('State parameter is required', null, 400);
  }

  // @agent:forge Replace with session tenantId
  const tenantId = DEV_TENANT_ID;

  // Load eBay config from environment variables
  const config: eBayConfig = {
    appId: process.env.EBAY_APP_ID || '',
    certId: process.env.EBAY_CERT_ID || '',
    devId: process.env.EBAY_DEV_ID || '',
    ruName: process.env.EBAY_RU_NAME || '',
    environment: 'sandbox',
  };

  if (!config.appId || !config.certId) {
    return apiError('EBAY_APP_ID or EBAY_CERT_ID environment variable not set', null, 400);
  }

  try {
    // All DB work runs inside withTenant so the `ghostcart.tenant_id` GUC is
    // set on the connection before RLS policies evaluate. verifyStoredState
    // receives the transaction client so its audit_events SELECT sees rows.
    return await withTenant(tenantId, async (client: PoolClient) => {
      // Verify the returned state against the value stored at initiation time
      // and enforce freshness. A forged, mismatched, or expired state is
      // rejected before any token exchange happens (fail closed).
      const stateValid = await verifyStoredState(client, tenantId, state);
      if (!stateValid) {
        return apiError('Invalid or expired state parameter', null, 401);
      }

      // Create eBay client and exchange code for token
      const ebayClient = new eBayClient(config);
      const tokenResponse = await ebayClient.exchangeCodeForToken(code);

      // Upsert the live tokens into marketplace_connections so the sync
      // worker can pick them up. audit_events is INSERT-only (no UPDATE/
      // DELETE per migration 0003) so we can't store tokens there.
      await client.query(
        `INSERT INTO marketplace_connections
           (tenant_id, marketplace, connection_name, access_token, refresh_token,
            token_expires_at, app_id, cert_id, dev_id, ru_name, environment,
            status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
        ON CONFLICT (tenant_id, marketplace)
        DO UPDATE SET
           access_token = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           token_expires_at = EXCLUDED.token_expires_at,
           app_id = EXCLUDED.app_id,
           cert_id = EXCLUDED.cert_id,
           dev_id = EXCLUDED.dev_id,
           ru_name = EXCLUDED.ru_name,
           environment = EXCLUDED.environment,
           status = EXCLUDED.status,
           updated_at = now()`,
        [
          tenantId,
          'ebay',
          'eBay Store',
          tokenResponse.accessToken,
          tokenResponse.refreshToken,
          tokenResponse.expiresAt,
          config.appId,
          config.certId,
          config.devId,
          config.ruName,
          config.environment,
          'connected',
        ],
      );

      return apiSuccess({
        message: 'Token exchange successful',
        tokenExpiresAt: tokenResponse.expiresAt,
        hasRefreshToken: !!tokenResponse.refreshToken,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Distinguish auth rejection from infrastructure errors
    if (message.includes('Invalid or expired state parameter')) {
      return apiError(message, null, 401);
    }
    return apiError(`Failed to exchange code for token: ${message}`, null, 500);
  }
}
