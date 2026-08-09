import { describe, it, expect, vi } from 'vitest';

// Mock db before importing routes that transitively load idempotency → db.
vi.mock('@/lib/db/index.js', () => ({
  db: {
    query: vi.fn(async () => ({ rowCount: 0, rows: [] })),
    connect: vi.fn(async () => ({
      query: vi.fn(async () => undefined),
      release: vi.fn(),
    })),
  },
  setTenantContextOn: vi.fn(async () => undefined),
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
}));

const { GET: getProducts, POST: postProducts } = await import('@/app/api/products/route');
const { PATCH: patchProductCorrections } = await import('@/app/api/products/[id]/corrections/route');
const idempotencyModule = await import('@/lib/api/idempotency');

import { NextRequest } from 'next/server';

describe('/api/products API routes', () => {
  it('GET /api/products returns paginated products with valid default query', async () => {
    const dbMock = (await import('@/lib/db/index.js')).db as unknown as { query: ReturnType<typeof vi.fn> };
    dbMock.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'prod_1', title: 'Sample', total: '1' }] });

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
    vi.spyOn(idempotencyModule, 'checkDuplicateSourceUrl').mockResolvedValue(false);
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
    vi.spyOn(idempotencyModule, 'checkDuplicateSourceUrl').mockResolvedValue(false);
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

  it('POST /api/products returns 409 on duplicate source_url', async () => {
    vi.spyOn(idempotencyModule, 'checkDuplicateSourceUrl').mockResolvedValue(true);
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com/product/dup',
        supplierId: 'sup_demo',
        idempotencyKey: 'idemp_key_dup',
      }),
    });
    const res = await postProducts(req);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.status).toBe('error');
    expect(body.error).toBe('Duplicate import');
    expect(body.details.sourceUrl).toBe('https://example.com/product/dup');
  });
});

describe('PATCH /api/products/[id]/corrections', () => {
  it('returns 400 when called without a JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/prod_123/corrections');
    const res = await patchProductCorrections(req, { params: { id: 'prod_123' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty corrections body', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/prod_123/corrections', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await patchProductCorrections(req, { params: { id: 'prod_123' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-editable fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/prod_123/corrections', {
      method: 'PATCH',
      body: JSON.stringify({ illegal_field: 'x' }),
    });
    const res = await patchProductCorrections(req, { params: { id: 'prod_123' } });
    expect(res.status).toBe(400);
  });
});
