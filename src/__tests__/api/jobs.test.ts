import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db/index.js', () => ({
  db: {
    query: vi.fn(async () => ({ rowCount: 0, rows: [] })),
    connect: vi.fn(async () => ({ query: vi.fn(async () => undefined), release: vi.fn() })),
  },
  withTenant: vi.fn(async (_tenantId: string, work: (client: unknown) => Promise<unknown>) => work({})),
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

const { GET: getJob } = await import('@/app/api/jobs/[id]/route');
import { NextRequest } from 'next/server';

const TENANT = '00000000-0000-0000-0000-000000000001';
const JOB_UUID = '11111111-1111-1111-1111-111111111111';

describe('GET /api/jobs/[id]', () => {
  it('returns 400 for a non-UUID id', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs/not-a-uuid');
    const res = await getJob(req, { params: { id: 'not-a-uuid' } });
    expect(res.status).toBe(400);
  });

  it('returns 404 when the job does not exist', async () => {
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue(null);
    const req = new NextRequest(`http://localhost:3000/api/jobs/${JOB_UUID}`);
    const res = await getJob(req, { params: { id: JOB_UUID } });
    expect(res.status).toBe(404);
  });

  it('returns the job record for an existing job', async () => {
    const mockWithTenant = (await import('@/lib/db/index.js')).withTenant as unknown as ReturnType<typeof vi.fn>;
    mockWithTenant.mockResolvedValue({
      id: JOB_UUID,
      tenantId: TENANT,
      type: 'product.import',
      payload: { url: 'https://example.com/p' },
      idempotencyKey: 'k',
      status: 'completed',
      attempts: 0,
      lastError: null,
      createdAt: '2026-08-08T00:00:00Z',
      completedAt: '2026-08-08T00:00:05Z',
    });
    const req = new NextRequest(`http://localhost:3000/api/jobs/${JOB_UUID}`);
    const res = await getJob(req, { params: { id: JOB_UUID } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(body.data.id).toBe(JOB_UUID);
    expect(body.data.type).toBe('product.import');
    expect(body.data.status).toBe('completed');
  });
});
