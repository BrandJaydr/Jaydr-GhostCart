/**
 * eBay Webhook Verification & Endpoint Challenge Test Suite
 *
 * Validates:
 * 1. Endpoint challenge response generation (SHA-256)
 * 2. ECC public-key ECDSA signature verification
 * 3. Tamper detection and invalid signature rejection (HTTP 412)
 * 4. Replay attack protection
 * 5. Tenant resolution & cross-tenant security (SEC-014)
 *
 * @agent:oracle Tests for Phase 1 eBay Webhook Hardening
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateKeyPairSync, createSign, createHash, createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const { mockQuery, mockDb, mockAddQueue } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockDb = { query: mockQuery };
  const mockAddQueue = vi.fn().mockResolvedValue({ id: 'job-123' });
  return { mockQuery, mockDb, mockAddQueue };
});

vi.mock('@/lib/db/index', () => ({
  db: mockDb,
  withTenant: vi.fn(async (_tenantId: string, work: (client: unknown) => Promise<unknown>) => work(mockDb)),
}));

vi.mock('@/lib/queue/index', () => ({
  ebayWebhookQueue: {
    add: mockAddQueue,
  },
}));

import {
  validateEndpointChallenge,
  verifyEBaySignature,
  verifyWebhookSignature,
  clearPublicKeyCacheForTesting,
} from '@/lib/adapters/ebay/webhook-handler';
import { GET, POST } from '@/app/api/ebay/webhook/route';

function mockQueryResult(rows: Record<string, unknown>[] = [], rowCount = rows.length) {
  return {
    rows,
    command: 'SELECT',
    rowCount,
    oid: 0,
    fields: [],
  };
}

describe('eBay Webhook Endpoint Challenge Validation', () => {
  const verificationToken = 'my_secret_verification_token_123';
  const endpointUrl = 'https://api.ghostcart.io/api/ebay/webhook';
  const challengeCode = 'challenge_abc_12345';

  it('generates deterministic SHA-256 challengeResponse', () => {
    const expectedHash = createHash('sha256')
      .update(challengeCode + verificationToken + endpointUrl)
      .digest('hex');

    const result = validateEndpointChallenge(challengeCode, verificationToken, endpointUrl);
    expect(result).toBe(expectedHash);
    expect(result).toHaveLength(64);
  });

  it('GET /api/ebay/webhook returns 200 with challengeResponse', async () => {
    process.env.EBAY_VERIFICATION_TOKEN = verificationToken;
    process.env.EBAY_ENDPOINT_URL = endpointUrl;

    const req = new NextRequest(`https://api.ghostcart.io/api/ebay/webhook?challenge_code=${challengeCode}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.challengeResponse).toBe(
      validateEndpointChallenge(challengeCode, verificationToken, endpointUrl),
    );
  });

  it('GET /api/ebay/webhook returns 400 if challenge_code is missing', async () => {
    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe('error');
    expect(data.error).toContain('Missing challenge_code');
  });
});

describe('eBay ECC Signature Verification', () => {
  let publicKeyPem: string;
  let privateKeyPem: string;

  beforeEach(() => {
    clearPublicKeyCacheForTesting();
    vi.clearAllMocks();

    // Generate ephemeral EC P-256 keypair for testing
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    publicKeyPem = publicKey;
    privateKeyPem = privateKey;
  });

  function createSignedHeader(payload: string, kid = 'test-key-id'): string {
    const signer = createSign('SHA256');
    signer.update(payload);
    const signature = signer.sign(privateKeyPem);

    const headerObj = {
      alg: 'ECDSA',
      kid,
      signature: signature.toString('base64'),
    };
    return Buffer.from(JSON.stringify(headerObj)).toString('base64');
  }

  it('validates a legitimate ECC-signed payload', async () => {
    const payload = JSON.stringify({
      metadata: { topic: 'ITEM_SOLD' },
      notification: { notificationId: 'notif-1', data: { itemId: 'item-100' } },
    });

    const signatureHeader = createSignedHeader(payload);
    const result = await verifyEBaySignature(payload, signatureHeader, {
      publicKeyFetcher: async () => publicKeyPem,
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects tampered payloads', async () => {
    const originalPayload = JSON.stringify({
      metadata: { topic: 'ITEM_SOLD' },
      notification: { notificationId: 'notif-1', data: { itemId: 'item-100' } },
    });
    const signatureHeader = createSignedHeader(originalPayload);

    const tamperedPayload = JSON.stringify({
      metadata: { topic: 'ITEM_SOLD' },
      notification: { notificationId: 'notif-1', data: { itemId: 'item-999' } },
    });

    const result = await verifyEBaySignature(tamperedPayload, signatureHeader, {
      publicKeyFetcher: async () => publicKeyPem,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Cryptographic signature verification failed');
  });

  it('rejects invalid or corrupted base64 headers', async () => {
    const payload = '{"test": true}';
    const result = await verifyEBaySignature(payload, 'not-valid-base64', {
      publicKeyFetcher: async () => publicKeyPem,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid X-EBAY-SIGNATURE');
  });

  it('rejects headers missing kid or signature fields', async () => {
    const payload = '{"test": true}';
    const invalidHeader = Buffer.from(JSON.stringify({ alg: 'ECDSA' })).toString('base64');

    const result = await verifyEBaySignature(payload, invalidHeader, {
      publicKeyFetcher: async () => publicKeyPem,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing required "kid" or "signature"');
  });

  it('retains backward compatibility for legacy HMAC verification', () => {
    const payload = '{"action":"test"}';
    const secret = 'webhook_secret_abc';
    const validSig = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;

    const res = verifyWebhookSignature(payload, validSig, secret);
    expect(res.valid).toBe(true);

    const badSig = 'sha256=1111111111111111111111111111111111111111111111111111111111111111';
    const badRes = verifyWebhookSignature(payload, badSig, secret);
    expect(badRes.valid).toBe(false);
  });
});

describe('POST /api/ebay/webhook End-to-End Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when x-ebay-signature header is missing', async () => {
    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Missing signature header');
  });

  it('returns 412 when signature verification fails', async () => {
    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook', {
      method: 'POST',
      headers: {
        'x-ebay-signature': 'sha256=invalidhash000000000000000000000000000000000000000000000000000000',
      },
      body: JSON.stringify({ test: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(412);
  });

  it('enforces SEC-014: rejects notifications for unmapped sellers with 404', async () => {
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));
    mockQuery.mockResolvedValueOnce(mockQueryResult([]));

    const secret = 'test-secret';
    process.env.EBAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      sellerId: 'unauthorized_seller_999',
      eventType: 'ITEM_SOLD',
      eventId: 'evt-1',
    });
    const sig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook', {
      method: 'POST',
      headers: {
        'x-ebay-signature': sig,
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('No authorized marketplace connection found');
  });

  it('accepts valid notification, checks replay, and enqueues to BullMQ without blocking', async () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';

    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ tenant_id: tenantId }]))
      .mockResolvedValueOnce(mockQueryResult([]))
      .mockResolvedValueOnce(mockQueryResult([], 1));

    const secret = 'test-secret';
    process.env.EBAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      sellerId: 'seller_1',
      eventType: 'ITEM_SOLD',
      eventId: 'evt-unique-123',
      data: { itemId: 'item-888' },
    });
    const sig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook', {
      method: 'POST',
      headers: {
        'x-ebay-signature': sig,
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('success');
    expect(data.data.message).toBe('Webhook received and queued');

    // Assert BullMQ queue received the job
    expect(mockAddQueue).toHaveBeenCalledWith(
      'process-ebay-event',
      expect.objectContaining({
        eventId: 'evt-unique-123',
        eventType: 'ITEM_SOLD',
        tenantId,
      }),
      expect.objectContaining({
        jobId: 'ebay-event-evt-unique-123',
      }),
    );
  });

  it('handles duplicate events gracefully with 200 without enqueuing', async () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';

    mockQuery
      .mockResolvedValueOnce(mockQueryResult([{ tenant_id: tenantId }]))
      .mockResolvedValueOnce(mockQueryResult([{ id: 'existing-id' }]));

    const secret = 'test-secret';
    process.env.EBAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      sellerId: 'seller_1',
      eventType: 'ITEM_SOLD',
      eventId: 'evt-already-seen',
    });
    const sig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

    const req = new NextRequest('https://api.ghostcart.io/api/ebay/webhook', {
      method: 'POST',
      headers: {
        'x-ebay-signature': sig,
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.message).toBe('Duplicate event acknowledged');
    expect(mockAddQueue).not.toHaveBeenCalled();
  });
});
