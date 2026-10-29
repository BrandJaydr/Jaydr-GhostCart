import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

const { getServerSession } = await import('next-auth');
const { getAuthenticatedTenantId } = await import('@/lib/auth/tenant');

const tenantId = '00000000-0000-0000-0000-000000000001';

const mockGetServerSession = getServerSession as unknown as ReturnType<typeof vi.fn>;

describe('getAuthenticatedTenantId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the tenant UUID from an authenticated session', async () => {
    mockGetServerSession.mockResolvedValue({ user: { tenantId } });
    await expect(getAuthenticatedTenantId()).resolves.toBe(tenantId);
  });

  it('returns null when there is no authenticated session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expect(getAuthenticatedTenantId()).resolves.toBeNull();
  });

  it('fails closed when the session tenant is not a database UUID', async () => {
    mockGetServerSession.mockResolvedValue({ user: { tenantId: 'tenant_dev_001' } });
    await expect(getAuthenticatedTenantId()).resolves.toBeNull();
  });

  it('fails closed when the session has no tenant', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'dev@ghostcart.local' } });
    await expect(getAuthenticatedTenantId()).resolves.toBeNull();
  });
});
