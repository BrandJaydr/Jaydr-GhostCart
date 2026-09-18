import { type NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import {
  validateEndpointChallenge,
  verifyEBaySignature,
  verifyWebhookSignature,
  resolveWebhookTenant,
  storeWebhookEvent,
} from '@/lib/adapters/ebay/webhook-handler';
import { ebayWebhookQueue } from '@/lib/queue/index';

/**
 * GET /api/ebay/webhook
 * Handle eBay Endpoint Validation Challenge
 *
 * When registering or updating a webhook endpoint in the eBay Developer Portal,
 * eBay sends a GET request with a `challenge_code` query parameter.
 * GhostCart must respond with SHA-256(challenge_code + verification_token + endpoint_url).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get('challenge_code');

  if (!challengeCode) {
    return apiError('Missing challenge_code parameter', null, 400);
  }

  const verificationToken =
    process.env.EBAY_VERIFICATION_TOKEN || process.env.EBAY_WEBHOOK_SECRET;
  const endpointUrl =
    process.env.EBAY_ENDPOINT_URL || `${req.nextUrl.origin}/api/ebay/webhook`;

  if (!verificationToken) {
    console.error('[api/ebay/webhook] EBAY_VERIFICATION_TOKEN not configured');
    return apiError('Webhook verification token not configured', null, 500);
  }

  const challengeResponse = validateEndpointChallenge(
    challengeCode,
    verificationToken,
    endpointUrl,
  );

  // eBay endpoint validation specifically requires direct JSON { challengeResponse: "..." }
  return NextResponse.json({ challengeResponse }, { status: 200 });
}

/**
 * POST /api/ebay/webhook
 * Handle eBay webhook events
 *
 * Verifies webhook signature (ECC public-key or HMAC legacy) and queues event for async processing.
 * Resolves tenant securely without arbitrary tenant spoofing (SEC-014 fix).
 */
export async function POST(req: NextRequest) {
  // Get webhook signature from header
  const signature = req.headers.get('x-ebay-signature');
  if (!signature) {
    return apiError('Missing signature header', null, 401);
  }

  // Get raw body for signature verification
  const body = await req.text();

  // Verify signature: supports both official ECC X-EBAY-SIGNATURE and legacy test HMAC-SHA256
  let isSignatureValid = false;
  let failureReason: string | undefined;

  if (signature.startsWith('sha256=')) {
    // Legacy / test HMAC mode
    const webhookSecret =
      process.env.EBAY_WEBHOOK_SECRET || process.env.EBAY_VERIFICATION_TOKEN || '';
    const verification = verifyWebhookSignature(body, signature, webhookSecret);
    isSignatureValid = verification.valid;
    failureReason = verification.reason;
  } else {
    // Official eBay ECC public-key verification
    const verification = await verifyEBaySignature(body, signature, {
      environment: process.env.EBAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });
    isSignatureValid = verification.valid;
    failureReason = verification.reason;
  }

  if (!isSignatureValid) {
    console.error('[api/ebay/webhook] Signature verification failed:', failureReason);
    // eBay specification dictates HTTP 412 for failed signature verification
    return apiError('Invalid signature', { reason: failureReason }, 412);
  }

  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return apiError('Invalid JSON payload', null, 400);
  }

  const notification = payload.notification as Record<string, unknown> | undefined;
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const notificationData = notification?.data as Record<string, unknown> | undefined;

  // Extract event details (supporting both eBay Notification API format and GhostCart event format)
  const eventId =
    (typeof notification?.notificationId === 'string' && notification.notificationId) ||
    (typeof payload.eventId === 'string' && payload.eventId) ||
    `evt-${Date.now()}`;
  const eventType =
    (typeof metadata?.topic === 'string' && metadata.topic) ||
    (typeof payload.eventType === 'string' && payload.eventType) ||
    'unknown';
  const timestamp = Date.now();

  // SEC-014 Remediation: Securely resolve tenant from marketplace_connections
  const sellerIdentifier =
    (typeof notificationData?.username === 'string' && notificationData.username) ||
    (typeof notificationData?.userId === 'string' && notificationData.userId) ||
    (typeof notificationData?.sellerId === 'string' && notificationData.sellerId) ||
    (typeof payload.sellerId === 'string' && payload.sellerId) ||
    undefined;

  const resolvedTenantId = await resolveWebhookTenant(sellerIdentifier);
  if (!resolvedTenantId) {
    console.error('[api/ebay/webhook] SEC-014: Rejected unmapped seller notification:', sellerIdentifier);
    return apiError('No authorized marketplace connection found for this notification', null, 404);
  }

  try {
    // Store webhook event in DB for replay protection
    const { duplicate } = await storeWebhookEvent(resolvedTenantId, 'ebay', {
      eventType,
      eventId,
      payload,
      timestamp,
      signature,
    });

    if (duplicate) {
      // Duplicate event - acknowledge immediately without re-enqueuing
      return apiSuccess({ message: 'Duplicate event acknowledged', eventId });
    }

    // Asynchronously dispatch to BullMQ worker queue for <100ms response time
    await ebayWebhookQueue.add(
      'process-ebay-event',
      {
        eventId,
        eventType,
        tenantId: resolvedTenantId,
        payload,
      },
      {
        jobId: `ebay-event-${eventId}`,
      },
    );

    return apiSuccess({ message: 'Webhook received and queued', eventId, eventType });
  } catch (err) {
    console.error('[api/ebay/webhook] Enqueueing error:', err);
    return apiError('Failed to process webhook event', null, 500);
  }
}

