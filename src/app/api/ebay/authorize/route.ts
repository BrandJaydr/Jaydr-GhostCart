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
 * All four eBay app credentials are required by the OAuth flow: `ruName` is
 * sent as `redirect_uri` by both getAuthorizationUrl() and
 * exchangeCodeForToken(), and devId is part of the app identity. Checking only
 * appId/certId let a misconfigured environment build a broken auth URL or fail
 * the exchange downstream instead of failing closed here.
 *
 * @returns the names of the missing variables (never their values).
 */
const REQUIRED_EBAY_ENV = ['EBAY_APP_ID', 'EBAY_CERT_ID', 'EBAY_DEV_ID', 'EBAY_RU_NAME'] as const;

function missingEbayEnv(): string[] {
  return REQUIRED_EBAY_ENV.filter((name) => !process.env[name]);
}

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
    `SELECT created_at AS issued_at
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

  // The WHERE clause already matches the exact state, so a second comparison
  // here is dead code. audit_events is append-only (migration 0003), which
  // also means a stale row cannot shadow a fresh one — the freshness check
  // below is the replay defence.
  const row = rows[0] as { issued_at?: string };
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

  const missing = missingEbayEnv();
  if (missing.length > 0) {
    return apiError(
      `Missing required eBay environment variables: ${missing.join(', ')}`,
      null,
      400,
    );
  }

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

    // Generate state parameter for CSRF protection
    const state = Buffer.from(`${tenantId}:${Date.now()}`).toString('base64');

    // Create eBay client and get authorization URL
    const oauthClient = new eBayClient(config);
    const authUrl = oauthClient.getAuthorizationUrl(state);

    // Store state in database for verification (audit_events is immutable:
    // INSERT only, no UPDATE/DELETE — see migration 0003). Rows are never
    // pruned here, so a periodic cleanup of ebay.auth_initiated rows older
    // than N days is a separate Medium ops follow-up; migration 0002 already
    // indexes tenant_id/created_at DESC for that query.
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

  const missing = missingEbayEnv();
  if (missing.length > 0) {
    return apiError(
      `Missing required eBay environment variables: ${missing.join(', ')}`,
      null,
      400,
    );
  }

  // Load eBay config from environment variables
  const config: eBayConfig = {
    appId: process.env.EBAY_APP_ID || '',
    certId: process.env.EBAY_CERT_ID || '',
    devId: process.env.EBAY_DEV_ID || '',
    ruName: process.env.EBAY_RU_NAME || '',
    environment: 'sandbox',
  };

  try {
    // Verify the returned state in a short tenant-scoped transaction, then
    // release the pooled client before any network I/O. withTenant sets the
    // ghostcart.tenant_id GUC before the SELECT; a bare pool query would see
    // no rows and reject every legitimate callback.
    const stateValid = await withTenant(tenantId, async (client: PoolClient) =>
      verifyStoredState(client, tenantId, state),
    );

    if (!stateValid) {
      // A forged, mismatched, or expired state is rejected before any token
      // exchange happens. This is returned, never thrown, so no catch-branch
      // string match is needed.
      return apiError('Invalid or expired state parameter', null, 401);
    }

    // The exchange runs outside any transaction. Holding a pooled client
    // (max 10, connectionTimeoutMillis 5000) across this outbound HTTP call
    // would let a slow eBay token endpoint starve the whole pool.
    const oauthClient = new eBayClient(config);
    const tokenResponse = await oauthClient.exchangeCodeForToken(code);

    // Token persistence is deliberately NOT done here. Writers must not
    // store tokens in audit_events (INSERT-only, no UPDATE/DELETE per
    // migration 0003) and must not store them in plaintext; the GC-102
    // decision requires application-layer encryption before any token is
    // written. Persistence is tracked as GC-121-B1-FU1 (issue #127).

    return apiSuccess({
      message: 'Token exchange successful',
      tokenExpiresAt: tokenResponse.expiresAt,
      hasRefreshToken: !!tokenResponse.refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError(`Failed to exchange code for token: ${message}`, null, 500);
  }
}
