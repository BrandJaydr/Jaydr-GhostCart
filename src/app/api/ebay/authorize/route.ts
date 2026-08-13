import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { getEBayClient, type eBayConfig, eBayClient } from '@/lib/adapters/ebay/ebay-client';
import { db, DEV_TENANT_ID } from '@/lib/db/index';

/**
 * Schema for eBay authorization request
 */
const AuthorizeSchema = z.object({
  environment: z.enum(['sandbox', 'production']).optional(),
});

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

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;

  try {
    // Check if eBay credentials are configured
    const config: eBayConfig = {
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      ruName: process.env.EBAY_RU_NAME || '',
      environment,
    };

    if (!config.appId || !config.certId || !config.devId || !config.ruName) {
      return apiError(
        'eBay credentials not configured',
        {
          hint: 'Set EBay environment variables: EBAY_APP_ID, EBAY_CERT_ID, EBAY_DEV_ID, EBAY_RU_NAME',
        },
        500,
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(`${tenantId}:${Date.now()}`).toString('base64');

    // Create eBay client and get authorization URL
    const ebayClient = new eBayClient(config);
    const authUrl = ebayClient.getAuthorizationUrl(state);

    // Store state in database for verification
    await db.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'ebay.auth_initiated', 'marketplace_connections', NULL, $2, now())`,
      [tenantId, JSON.stringify({ state, environment })],
    );

    return apiSuccess({
      authUrl,
      state,
      environment,
    });
  } catch (err) {
    console.error('[api/ebay/authorize] Error:', err);
    return apiError('Failed to initiate eBay authorization', null, 500);
  }
}

/**
 * GET /api/ebay/authorize/callback
 * Handle eBay OAuth callback
 *
 * Exchange authorization code for access token and store credentials.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return apiError(`eBay authorization error: ${error}`, null, 400);
  }

  if (!code) {
    return apiError('Authorization code is required', null, 400);
  }

  if (!state) {
    return apiError('State parameter is required', null, 400);
  }

  // @agent:forge Replace with session tenantId
  const tenantId = DEV_TENANT_ID;

  try {
    // Verify state parameter
    const decodedState = Buffer.from(state, 'base64').toString('utf-8');
    const [stateTenantId] = decodedState.split(':');

    if (stateTenantId !== tenantId) {
      return apiError('Invalid state parameter', null, 400);
    }

    // Exchange code for token
    const config: eBayConfig = {
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      ruName: process.env.EBAY_RU_NAME || '',
      environment: 'sandbox',
    };

    const ebayClient = new eBayClient(config);
    const token = await ebayClient.exchangeCodeForToken(code);

    // Store credentials in database
    await db.query(
      `INSERT INTO marketplace_connections
         (tenant_id, marketplace, app_id, cert_id, dev_id, ru_name,
          access_token, refresh_token, token_expires_at, environment, connected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       ON CONFLICT (tenant_id, marketplace, environment) DO UPDATE
         SET access_token = EXCLUDED.access_token,
             refresh_token = EXCLUDED.refresh_token,
             token_expires_at = EXCLUDED.token_expires_at,
             connected_at = now()`,
      [
        tenantId,
        'ebay',
        config.appId,
        config.certId,
        config.devId,
        config.ruName,
        token.accessToken,
        token.refreshToken,
        token.expiresAt,
        config.environment,
      ],
    );

    // Log successful authorization
    await db.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'ebay.authorized', 'marketplace_connections', NULL, $2, now())`,
      [tenantId, JSON.stringify({ environment: config.environment })],
    );

    return apiSuccess({
      message: 'eBay authorization successful',
      environment: config.environment,
    });
  } catch (err) {
    console.error('[api/ebay/authorize/callback] Error:', err);
    return apiError('Failed to complete eBay authorization', null, 500);
  }
}
