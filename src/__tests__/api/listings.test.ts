import { describe, it, expect, vi } from 'vitest';

// Mock db before importing routes that transitively load withTenant.
vi.mock('@/lib/db/index.js', () => ({
  db: {
    query: vi.fn(async () => ({ rowCount: 0, rows: [] })),
    connect: vi.fn(async () => ({
      query: vi.fn(async () => undefined),
      release: vi.fn(),
    })),
  },
  withTenant: vi.fn(async (_tenantId: string, work: (client: unknown) => Promise<unknown>) => work({})),
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  setTenantContextOn: vi.fn(async () => undefined),
}));

const { GET: getListings, POST: postListings } = await import('@/app/api/listings/route');
import { NextRequest } from 'next/server';

describe('/api/listings API routes', () => {
  it('GET /api/listings returns paginated listing drafts', async () => {
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue({
      rows: [
        {
          id: 'lst_123',
          tenantId: '00000000-0000-0000-0000-000000000001',
          productId: 'prod_123',
          marketplace: 'ebay',
          state: 'draft',
          title: 'Test Listing',
          description: 'A test listing',
          attributes: {},
          listPriceCents: 1999,
          currency: 'USD',
          shipping: {},
          imageUrls: [],
          idempotencyKey: null,
          marketplaceListingId: null,
          lastError: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
      count: '1',
    });

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
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue({
      id: 'lst_new_123',
      tenantId: '00000000-0000-0000-0000-000000000001',
      productId: 'prod_123',
      marketplace: 'ebay',
      state: 'draft',
      title: '',
      description: '',
      attributes: {},
      listPriceCents: null,
      currency: 'USD',
      shipping: {},
      imageUrls: [],
      idempotencyKey: 'idemp_lst_123',
      marketplaceListingId: null,
      lastError: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });

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
