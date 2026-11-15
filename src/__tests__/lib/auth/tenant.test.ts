import { describe, expect, it, vi } from 'vitest';

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession }));

const { getAuthenticatedTenantId } = await import('@/lib/auth/tenant');

describe('getAuthenticatedTenantId', () => {
  it('returns the tenant UUID from an authenticated session', async () => {
    getServerSession.mockResolvedValue({
      user: { tenantId: '00000000-0000-0000-0000-000000000001' },
    });

    await expect(getAuthenticatedTenantId()).resolves.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
  });

  it('rejects missing sessions and malformed tenant IDs', async () => {
    getServerSession.mockResolvedValueOnce(null);
    await expect(getAuthenticatedTenantId()).resolves.toBeNull();

    getServerSession.mockResolvedValueOnce({ user: { tenantId: 'tenant_dev_001' } });
    await expect(getAuthenticatedTenantId()).resolves.toBeNull();
  });
});
