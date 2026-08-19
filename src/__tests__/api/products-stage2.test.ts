import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  query: vi.fn(async () => ({ rowCount: 0, rows: [] })),
  connect: vi.fn(async () => ({ query: vi.fn(async () => undefined), release: vi.fn() })),
};

vi.mock('@/lib/db/index.js', () => ({
  db: mockDb,
  withTenant: vi.fn(async (_tenantId: string, work: (client: any) => Promise<any>) => work(mockDb)),
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  setTenantContextOn: vi.fn(async () => undefined),
}));

vi.mock('@/lib/middleware/resolve-actor', () => ({
  resolveActor: vi.fn(async () => ({
    userId: '00000000-0000-0000-0000-000000000001',
    tenantId: '00000000-0000-0000-0000-000000000001',
    role: 'owner',
  })),
}));

const { POST: approveProduct } = await import('@/app/api/products/[id]/approve/route');
const { POST: refreshProduct } = await import('@/app/api/products/[id]/refresh/route');
import { NextRequest } from 'next/server';

const PROD_UUID = '22222222-2222-2222-2222-222222222222';

beforeEach(async () => {
  vi.clearAllMocks();
  const { withTenant } = await import('@/lib/db/index.js');
  vi.mocked(withTenant).mockImplementation(
    async (_tenantId: string, work: (client: any) => Promise<any>) => work(mockDb)
  );
});

describe('POST /api/products/[id]/approve', () => {
  it('returns 400 for a non-UUID id', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/bad/approve', { method: 'POST' });
    const res = await approveProduct(req, { params: { id: 'bad' } });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the product does not exist', async () => {
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue({ found: false, approved: false });
    const req = new NextRequest(`http://localhost:3000/api/products/${PROD_UUID}/approve`, { method: 'POST' });
    const res = await approveProduct(req, { params: { id: PROD_UUID } });
    expect(res.status).toBe(404);
  });

  it('approves a reviews-pending product to ready', async () => {
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue({ found: true, approved: true });
    const req = new NextRequest(`http://localhost:3000/api/products/${PROD_UUID}/approve`, { method: 'POST', body: '{}' });
    const res = await approveProduct(req, { params: { id: PROD_UUID } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.reviewStatus).toBe('approved');
  });
});

describe('POST /api/products/[id]/refresh', () => {
  it('returns 400 for a non-UUID id', async () => {
    const req = new NextRequest('http://localhost:3000/api/products/bad/refresh', { method: 'POST' });
    const res = await refreshProduct(req, { params: { id: 'bad' } });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the product does not exist', async () => {
    const req = new NextRequest(`http://localhost:3000/api/products/${PROD_UUID}/refresh`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await refreshProduct(req, { params: { id: PROD_UUID } });
    expect(res.status).toBe(404);
  });
});
