import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Test-only key material — not a real credential. 32 bytes expressed as hex.
const TEST_KEY = 'a'.repeat(64);
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const mockExchange = vi.fn();
const mockTenantQuery = vi.fn(
  async (_sql: string, _params?: unknown[]) => ({ rowCount: 0, rows: [] }),
);
const mockWithTenant = vi.fn(
  async (_tenantId: string, work: (client: { query: typeof mockTenantQuery }) => Promise<unknown>) =>
    work({ query: mockTenantQuery }),
);

vi.mock('@/lib/adapters/ebay/ebay-client.js', () => ({
  eBayClient: class {
    exchangeCodeForToken = mockExchange;
  },
}));

vi.mock('@/lib/db/index.js', () => ({
  db: {
    query: vi.fn(async () => ({ rowCount: 0, rows: [] })),
  },
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  withTenant: mockWithTenant,
}));

const { GET } = await import('@/app/api/ebay/authorize/route');
const { decrypt, encrypt } = await import('@/lib/crypto/encryption');

function callbackRequest(): NextRequest {
  const state = Buffer.from(`${TENANT_ID}:${Date.now()}`).toString('base64');
  return new NextRequest(
    `http://localhost:3000/api/ebay/authorize/callback?code=test-code&state=${encodeURIComponent(state)}`,
  );
}

function connectionInsert() {
  const call = mockTenantQuery.mock.calls.find(
    (args: unknown[]) =>
      typeof args[0] === 'string' && args[0].includes('INSERT INTO marketplace_connections'),
  );
  expect(call).toBeDefined();
  return { sql: call![0] as string, params: call![1] as unknown[] };
}

describe('GET /api/ebay/authorize/callback — token persistence (#127)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ENCRYPTION_KEY = TEST_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    process.env.EBAY_APP_ID = 'test-app';
    process.env.EBAY_CERT_ID = 'test-cert';
    process.env.EBAY_DEV_ID = 'test-dev';
    process.env.EBAY_RU_NAME = 'test-ru-name';
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  it('upserts on the real UNIQUE(tenant_id, marketplace) constraint in tenant scope', async () => {
    mockExchange.mockResolvedValueOnce({
      accessToken: 'plain-access-token',
      refreshToken: 'plain-refresh-token',
      expiresAt: new Date('2026-11-21T12:00:00.000Z'),
    });

    const response = await GET(callbackRequest());
    expect(response.status).toBe(200);
    expect(mockWithTenant).toHaveBeenCalledWith(TENANT_ID, expect.any(Function));

    const { sql } = connectionInsert();
    expect(sql).toContain('ON CONFLICT (tenant_id, marketplace) DO UPDATE');
    expect(sql).not.toContain('ON CONFLICT (tenant_id, marketplace, environment)');
  });

  it('stores access and refresh tokens only as decryptable ciphertext', async () => {
    mockExchange.mockResolvedValueOnce({
      accessToken: 'plain-access-token',
      refreshToken: 'plain-refresh-token',
      expiresAt: new Date('2026-11-21T12:00:00.000Z'),
    });

    const response = await GET(callbackRequest());
    expect(response.status).toBe(200);

    // params: tenant, marketplace, app_id, cert_id, dev_id, ru_name,
    //         access_token, refresh_token, expires_at, environment
    const { params } = connectionInsert();
    const storedAccess = params[6] as string;
    const storedRefresh = params[7] as string;

    expect(storedAccess).not.toBe('plain-access-token');
    expect(storedRefresh).not.toBe('plain-refresh-token');
    expect(storedAccess.startsWith('v1:')).toBe(true);
    expect(storedRefresh.startsWith('v1:')).toBe(true);
    expect(decrypt(storedAccess)).toBe('plain-access-token');
    expect(decrypt(storedRefresh)).toBe('plain-refresh-token');
  });

  it('uses a fresh IV so identical tokens never produce identical ciphertext', async () => {
    const token = () => ({
      accessToken: 'same-access-token',
      refreshToken: 'same-refresh-token',
      expiresAt: new Date('2026-11-21T12:00:00.000Z'),
    });
    mockExchange.mockResolvedValueOnce(token()).mockResolvedValueOnce(token());

    await GET(callbackRequest());
    await GET(callbackRequest());

    const inserts = mockTenantQuery.mock.calls.filter(
      (args: unknown[]) =>
        typeof args[0] === 'string' && args[0].includes('INSERT INTO marketplace_connections'),
    );
    expect(inserts).toHaveLength(2);

    const first = inserts[0][1] as unknown[];
    const second = inserts[1][1] as unknown[];
    expect(first[6]).not.toBe(second[6]);
    expect(decrypt(first[6] as string)).toBe(decrypt(second[6] as string));
  });

  it('fails fast before exchange when no encryption key is configured', async () => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;

    const response = await GET(callbackRequest());
    expect(response.status).toBe(500);
    expect(mockExchange).not.toHaveBeenCalled();
    expect(mockWithTenant).not.toHaveBeenCalled();
    expect(mockTenantQuery).not.toHaveBeenCalled();
  });

  it('accepts the legacy TOKEN_ENCRYPTION_KEY alias', async () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.TOKEN_ENCRYPTION_KEY = TEST_KEY;
    mockExchange.mockResolvedValueOnce({
      accessToken: 'alias-access',
      refreshToken: 'alias-refresh',
      expiresAt: new Date('2026-11-21T12:00:00.000Z'),
    });

    const response = await GET(callbackRequest());
    expect(response.status).toBe(200);

    const { params } = connectionInsert();
    expect(decrypt(params[6] as string)).toBe('alias-access');
  });

  it('rejects a tampered ciphertext envelope', () => {
    const envelope = encrypt('secret');
    const parts = envelope.split(':');
    parts[2] = Buffer.alloc(16).toString('base64'); // corrupt auth tag
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});
