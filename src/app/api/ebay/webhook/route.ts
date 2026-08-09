import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { verifyWebhookSignature, storeWebhookEvent, markWebhookEventProcessed } from '@/lib/adapters/ebay/webhook-handler';
import { db, DEV_TENANT_ID } from '@/lib/db/index.js';

/**
 * POST /api/ebay/webhook
 * Handle eBay webhook events
 *
 * Verifies webhook signature and stores event for processing.
 * Uses polling fallback if webhooks fail.
 */
export async function POST(req: NextRequest) {
  // Get webhook signature from header
  const signature = req.headers.get('x-ebay-signature');
  if (!signature) {
    return apiError('Missing signature header', null, 401);
  }

  // Get raw body for signature verification
  const body = await req.text();

  // Get webhook secret from environment
  const webhookSecret = process.env.EBAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return apiError('Webhook secret not configured', null, 500);
  }

  // Verify signature
  const verification = verifyWebhookSignature(body, signature, webhookSecret);
  if (!verification.valid) {
    console.error('[api/ebay/webhook] Signature verification failed:', verification.reason);
    return apiError('Invalid signature', { reason: verification.reason }, 401);
  }

  // Parse payload
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return apiError('Invalid JSON payload', null, 400);
  }

  // Extract event details
  const eventType = (payload as any).eventType || 'unknown';
  const eventId = (payload as any).eventId || '';
  const timestamp = Date.now();

  // @agent:forge Replace this with the tenantId resolved from the
  // authenticated session or webhook metadata
  const tenantId = DEV_TENANT_ID;

  try {
    // Store webhook event
    const { stored, duplicate } = await storeWebhookEvent(tenantId, 'ebay', {
      eventType,
      eventId,
      payload,
      timestamp,
      signature,
    });

    if (duplicate) {
      // Duplicate event - acknowledge but don't process
      return apiSuccess({ message: 'Duplicate event acknowledged', eventId });
    }

    // Process the event based on type
    // This is a simplified implementation - in production, dispatch to appropriate handlers
    switch (eventType) {
      case 'ITEM_CREATED':
      case 'ITEM_UPDATED':
      case 'ITEM_SOLD':
        // Update listing status in database
        await processListingEvent(tenantId, eventId, payload);
        break;
      case 'ORDER_CREATED':
      case 'ORDER_UPDATED':
        // Process order event
        await processOrderEvent(tenantId, eventId, payload);
        break;
      default:
        console.log(`[api/ebay/webhook] Unknown event type: ${eventType}`);
    }

    // Mark event as processed
    await markWebhookEventProcessed(eventId);

    return apiSuccess({ message: 'Webhook processed', eventId, eventType });
  } catch (err) {
    console.error('[api/ebay/webhook] Processing error:', err);
    return apiError('Failed to process webhook', null, 500);
  }
}

/**
 * Process listing-related webhook events
 */
async function processListingEvent(tenantId: string, eventId: string, payload: unknown): Promise<void> {
  // Extract listing ID from payload
  const listingId = (payload as any).listingId || (payload as any).itemId;

  if (!listingId) {
    console.warn('[api/ebay/webhook] No listing ID in payload');
    return;
  }

  // Update listing status based on event type
  const eventType = (payload as any).eventType;
  let newState: string | null = null;

  switch (eventType) {
    case 'ITEM_CREATED':
      newState = 'published';
      break;
    case 'ITEM_UPDATED':
      newState = 'published';
      break;
    case 'ITEM_SOLD':
      newState = 'published';
      break;
  }

  if (newState) {
    await db.query(
      `UPDATE listings
       SET state = $1, marketplace_listing_id = $2, updated_at = now()
       WHERE marketplace_listing_id = $2 AND tenant_id = $3`,
      [newState, listingId, tenantId],
    );
  }
}

/**
 * Process order-related webhook events
 */
async function processOrderEvent(tenantId: string, eventId: string, payload: unknown): Promise<void> {
  // Extract order ID from payload
  const orderId = (payload as any).orderId;

  if (!orderId) {
    console.warn('[api/ebay/webhook] No order ID in payload');
    return;
  }

  // Store order information
  // This would be expanded in production to handle order processing
  console.log(`[api/ebay/webhook] Order event: ${eventId}`, payload);
}
