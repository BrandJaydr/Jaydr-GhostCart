/**
 * eBay Webhook Handler
 *
 * Handles webhook signature verification and event processing.
 * Provides polling fallback when webhooks fail.
 *
 * @agent:oracle Add tests for webhook signature verification
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db/index';

export interface WebhookEvent {
  eventType: string;
  eventId: string;
  payload: unknown;
  timestamp: number;
  signature: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify eBay webhook signature
 * eBay uses HMAC-SHA256 with the webhook secret
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): VerificationResult {
  try {
    // eBay sends signature in format: sha256=<hex_hash>
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      return { valid: false, reason: 'Invalid signature format' };
    }

    const receivedHash = signatureParts[1];
    const expectedHash = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );

    if (!isValid) {
      return { valid: false, reason: 'Signature mismatch' };
    }

    return { valid: true };
  } catch (err) {
    console.error('[webhook-handler] Signature verification error:', err);
    return { valid: false, reason: 'Verification error' };
  }
}

/**
 * Store webhook event in database for replay protection
 */
export async function storeWebhookEvent(
  tenantId: string,
  marketplace: string,
  event: WebhookEvent,
): Promise<{ stored: boolean; duplicate: boolean }> {
  try {
    // Check for duplicate event
    const existing = await db.query(
      `SELECT id FROM webhook_events
       WHERE tenant_id = $1 AND marketplace = $2 AND event_id = $3
       LIMIT 1`,
      [tenantId, marketplace, event.eventId],
    );

    if ((existing.rowCount ?? 0) > 0) {
      return { stored: false, duplicate: true };
    }

    // Store new event
    await db.query(
      `INSERT INTO webhook_events
         (tenant_id, marketplace, event_type, event_id, payload, signature, verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [
        tenantId,
        marketplace,
        event.eventType,
        event.eventId,
        JSON.stringify(event.payload),
        event.signature,
        true,
      ],
    );

    return { stored: true, duplicate: false };
  } catch (err) {
    console.error('[webhook-handler] Store event error:', err);
    return { stored: false, duplicate: false };
  }
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  try {
    await db.query(
      `UPDATE webhook_events
       SET processed = true, processed_at = now()
       WHERE event_id = $1`,
      [eventId],
    );
  } catch (err) {
    console.error('[webhook-handler] Mark processed error:', err);
  }
}

/**
 * Get unprocessed webhook events for a tenant
 */
export async function getUnprocessedWebhookEvents(
  tenantId: string,
  marketplace: string,
): Promise<Array<{ id: string; eventId: string; eventType: string; payload: unknown }>> {
  try {
    const result = await db.query(
      `SELECT id, event_id, event_type, payload
       FROM webhook_events
       WHERE tenant_id = $1 AND marketplace = $2 AND processed = false
       ORDER BY created_at ASC`,
      [tenantId, marketplace],
    );

    return result.rows.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      eventType: row.event_type,
      payload: row.payload,
    }));
  } catch (err) {
    console.error('[webhook-handler] Get unprocessed error:', err);
    return [];
  }
}
