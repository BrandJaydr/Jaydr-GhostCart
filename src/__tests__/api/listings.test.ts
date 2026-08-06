import { describe, it, expect } from 'vitest';
import { GET as getListings, POST as postListings } from '@/app/api/listings/route';
import { NextRequest } from 'next/server';

describe('/api/listings API routes', () => {
  it('GET /api/listings returns listing drafts', async () => {
    const req = new NextRequest('http://localhost:3000/api/listings?page=1&limit=10&state=draft');
    const res = await getListings(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it('GET /api/listings returns 400 on invalid state filter', async () => {
    const req = new NextRequest('http://localhost:3000/api/listings?state=unknown_state');
    const res = await getListings(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
  });

  it('POST /api/listings creates a draft listing with 201 status', async () => {
    const req = new NextRequest('http://localhost:3000/api/listings', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'prod_123',
        marketplace: 'ebay',
        idempotencyKey: 'idemp_lst_123',
      }),
    });
    const res = await postListings(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.productId).toBe('prod_123');
    expect(body.data.marketplace).toBe('ebay');
  });

  it('POST /api/listings returns 400 when missing required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/listings', {
      method: 'POST',
      body: JSON.stringify({
        productId: '',
      }),
    });
    const res = await postListings(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.details.marketplace).toBeDefined();
  });
});
