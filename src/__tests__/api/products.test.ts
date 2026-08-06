import { describe, it, expect } from 'vitest';
import { GET as getProducts, POST as postProducts } from '@/app/api/products/route';
import { NextRequest } from 'next/server';

describe('/api/products API routes', () => {
  it('GET /api/products returns paginated products with valid default query', async () => {
    const req = new NextRequest('http://localhost:3000/api/products?page=1&limit=10');
    const res = await getProducts(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it('GET /api/products returns 400 on invalid pagination parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/products?page=invalid');
    const res = await getProducts(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.error).toBe('Invalid query parameters');
  });

  it('POST /api/products enqueues import job with valid body', async () => {
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com/product/123',
        supplierId: 'sup_demo',
        idempotencyKey: 'idemp_key_123',
      }),
    });
    const res = await postProducts(req);
    expect(res.status).toBe(202);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.status).toBe('queued');
    expect(body.data.idempotencyKey).toBe('idemp_key_123');
  });

  it('POST /api/products returns 400 on invalid URL', async () => {
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({
        url: 'not-a-url',
        supplierId: 'sup_demo',
        idempotencyKey: 'idemp_key_123',
      }),
    });
    const res = await postProducts(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.details.url).toBeDefined();
  });
});
