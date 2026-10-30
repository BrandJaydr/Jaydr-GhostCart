import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/index.js', () => ({
  db: {
    query: vi.fn(),
  },
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
}));

const mockListingQueueAdd = vi.fn();

vi.mock('@/lib/queue', () => ({
  listingQueue: {
    add: mockListingQueueAdd,
  },
}));

const { POST: postEBaySubmit } = await import('@/app/api/ebay/submit/route');

describe('POST /api/ebay/submit API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/ebay/submit', {
      method: 'POST',
      body: 'invalid-json',
    });
    const res = await postEBaySubmit(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.message).toBe('Invalid JSON request body');
  });

  it('returns 400 when validation fails', async () => {
    const req = new NextRequest('http://localhost:3000/api/ebay/submit', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'invalid-uuid',
      }),
    });
    const res = await postEBaySubmit(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.message).toBe('Validation failed');
  });

  it('returns 404 when listing draft is not found', async () => {
    const { db } = await import('@/lib/db/index.js');
    vi.mocked(db.query).mockResolvedValueOnce({
      rowCount: 0,
      rows: [],
    } as any);

    const req = new NextRequest('http://localhost:3000/api/ebay/submit', {
      method: 'POST',
      body: JSON.stringify({
        listingId: '11111111-1111-1111-1111-111111111111',
      }),
    });
    const res = await postEBaySubmit(req);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.message).toBe('Listing not found');
  });

  it('enqueues job to listingQueue when REDIS_URL is present', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const { db } = await import('@/lib/db/index.js');
    vi.mocked(db.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: '11111111-1111-1111-1111-111111111111' }],
    } as any);

    mockListingQueueAdd.mockResolvedValueOnce({ id: 'job_submit_999' });

    const req = new NextRequest('http://localhost:3000/api/ebay/submit', {
      method: 'POST',
      body: JSON.stringify({
        listingId: '11111111-1111-1111-1111-111111111111',
        category: '1234',
        condition: 'New',
        listingType: 'FixedPriceItem',
        duration: 'GTC',
      }),
    });
    const res = await postEBaySubmit(req);
    expect(res.status).toBe(202);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.jobId).toBe('job_submit_999');
    expect(body.data.status).toBe('queued');

    expect(mockListingQueueAdd).toHaveBeenCalledWith(
      'listing.submit',
      {
        listingId: '11111111-1111-1111-1111-111111111111',
        tenantId: '00000000-0000-0000-0000-000000000001',
        idempotencyKey: 'submit_11111111-1111-1111-1111-111111111111',
        marketplace: 'ebay',
        category: '1234',
        condition: 'New',
        listingType: 'FixedPriceItem',
        duration: 'GTC',
      },
      { jobId: 'submit_submit_11111111-1111-1111-1111-111111111111' },
    );
  });

  it('falls back to 202 stub when REDIS_URL is missing', async () => {
    delete process.env.REDIS_URL;
    const { db } = await import('@/lib/db/index.js');
    vi.mocked(db.query).mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id: '11111111-1111-1111-1111-111111111111' }],
    } as any);

    const req = new NextRequest('http://localhost:3000/api/ebay/submit', {
      method: 'POST',
      body: JSON.stringify({
        listingId: '11111111-1111-1111-1111-111111111111',
      }),
    });
    const res = await postEBaySubmit(req);
    expect(res.status).toBe(202);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.status).toBe('queued');
    expect(mockListingQueueAdd).not.toHaveBeenCalled();
  });
});
