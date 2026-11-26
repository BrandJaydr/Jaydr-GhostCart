import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SEEDED_TENANT_ID = '00000000-0000-0000-0000-000000000001';

type Authorize = (
  credentials: { email?: string; password?: string } | undefined,
) => Promise<unknown>;

async function authorize(
  credentials?: { email?: string; password?: string },
): Promise<unknown> {
  const { authOptions } = await import('@/lib/auth/config');
  // next-auth exposes the real callback on provider.options; the top-level
  // `authorize` on the provider object is only a stub that returns null.
  const provider = authOptions.providers[0] as unknown as {
    options: { authorize: Authorize };
  };
  return provider.options.authorize(credentials);
}

describe('dev CredentialsProvider stub', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DEV_SEED_EMAIL', 'dev@ghostcart.local');
    vi.stubEnv('DEV_SEED_PASSWORD', 'dev-only-password');
    vi.stubEnv('DEV_TENANT_ID', SEEDED_TENANT_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('authenticates the seeded dev user with the seeded tenant UUID in development', async () => {
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toMatchObject({
      id: 'dev-user-1',
      email: 'dev@ghostcart.local',
      tenantId: SEEDED_TENANT_ID,
    });
  });

  it('rejects matching dev credentials outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();

    vi.stubEnv('NODE_ENV', 'test');
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();
  });

  it('fails closed on missing or blank seed configuration', async () => {
    vi.stubEnv('DEV_SEED_EMAIL', undefined);
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();

    vi.stubEnv('DEV_SEED_EMAIL', 'dev@ghostcart.local');
    vi.stubEnv('DEV_SEED_PASSWORD', '');
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: '' }),
    ).resolves.toBeNull();

    vi.stubEnv('DEV_SEED_PASSWORD', 'dev-only-password');
    vi.stubEnv('DEV_TENANT_ID', undefined);
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();
  });

  it('fails closed when DEV_TENANT_ID is not the seeded UUID', async () => {
    vi.stubEnv('DEV_TENANT_ID', 'tenant_dev_001');
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();

    vi.stubEnv('DEV_TENANT_ID', '00000000-0000-0000-0000-000000000002');
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'dev-only-password' }),
    ).resolves.toBeNull();
  });

  it('rejects wrong, empty or absent submitted credentials', async () => {
    await expect(
      authorize({ email: 'attacker@example.com', password: 'dev-only-password' }),
    ).resolves.toBeNull();
    await expect(
      authorize({ email: 'dev@ghostcart.local', password: 'wrong' }),
    ).resolves.toBeNull();
    await expect(authorize({ email: '', password: '' })).resolves.toBeNull();
    await expect(authorize(undefined)).resolves.toBeNull();
  });
});
