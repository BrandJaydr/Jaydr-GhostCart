import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDbQuery = vi.fn();
vi.mock('@/lib/db/index.js', () => ({
  withTenant: vi.fn().mockImplementation(async (tenantId, fn) => {
      const client = { query: mockDbQuery };
      return await fn(client);
    }),
  db: {
    query: vi.fn(),
  },
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
}));

const mockExchangeCodeForToken = vi.fn();
vi.mock('@/lib/adapters/ebay/ebay-client', () => ({
  eBayClient: vi.fn().mockImplementation(() => ({
    getAuthorizationUrl: (state: string) =>
      `https://oauth.ebay.com/oauth2/authorize?client_id=test&state=${state}`,
    exchangeCodeForToken: mockExchangeCodeForToken,
  })),
}));

const { GET: getAuthorize, POST: postAuthorize } = await import('@/app/api/ebay/authorize/route');

describe('eBay OAuth authorize routes', () => {
  const originalEnv = process.env;
  const devTenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      EBAY_APP_ID: 'test-app-id',
      EBAY_CERT_ID: 'test-cert-id',
      EBAY_DEV_ID: 'test-dev-id',
      EBAY_RU_NAME: 'test-ru-name',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/ebay/authorize', () => {
    it('returns authorization URL and stores state in audit_events', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const req = new NextRequest('http://localhost:3000/api/ebay/authorize', {
        method: 'POST',
        body: JSON.stringify({ environment: 'sandbox' }),
      });

      const res = await postAuthorize(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.authorizationUrl).toContain('oauth.ebay.com/oauth2/authorize');
      expect(body.data.state).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(body.data.expiresIn).toBe(600);

      // The state must be recorded at initiation time — the callback compares
      // against this row, so a missing write would make every callback 401.
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockDbQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('INSERT INTO audit_events');
      expect(sql).toContain("'ebay.auth_initiated'");
      expect(params[0]).toBe(devTenantId);
      expect(JSON.parse(params[1] as string)).toMatchObject({
        state: body.data.state,
        environment: 'sandbox',
      });
    });

    it('returns 400 when EBAY_APP_ID is missing', async () => {
      process.env.EBAY_APP_ID = '';
      const req = new NextRequest('http://localhost:3000/api/ebay/authorize', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await postAuthorize(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when EBAY_DEV_ID or EBAY_RU_NAME is missing', async () => {
      for (const name of ['EBAY_DEV_ID', 'EBAY_RU_NAME'] as const) {
        process.env[name] = '';
        const req = new NextRequest('http://localhost:3000/api/ebay/authorize', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const res = await postAuthorize(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain(name);

        process.env[name] = `test-${name.toLowerCase()}`;
      }
    });

    it('returns 400 when request body is invalid JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/ebay/authorize', {
        method: 'POST',
        body: 'not-json',
      });

      const res = await postAuthorize(req);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/ebay/authorize (callback)', () => {
    const validState = Buffer.from(`${devTenantId}:${Date.now()}`).toString('base64');
    const validCode = 'test-auth-code';

    it('exchanges code for token when state is valid and fresh', async () => {
      // Mock stored state lookup - valid and fresh
      mockDbQuery.mockResolvedValueOnce({
        rows: [
          {
            stored_state: validState,
            issued_at: new Date().toISOString(),
          },
        ],
      });

      mockExchangeCodeForToken.mockResolvedValueOnce({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?code=${validCode}&state=${validState}`,
      );

      const res = await getAuthorize(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.message).toBe('Token exchange successful');
      expect(body.data.hasRefreshToken).toBe(true);

      // Only the state lookup runs: token persistence is out of this PR's
      // scope (issue #127, GC-102 encryption first). A write here would put
      // plaintext tokens in the database.
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
      expect((mockDbQuery.mock.calls[0] as [string])[0]).toContain('FROM audit_events');
    });

    it('returns 400 when a required eBay env var is missing', async () => {
      process.env.EBAY_RU_NAME = '';
      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?code=${validCode}&state=${validState}`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(400);
      expect(mockExchangeCodeForToken).not.toHaveBeenCalled();
    });

    it('returns 401 when state is forged (not found in audit_events)', async () => {
      const forgedState = Buffer.from(`${devTenantId}:12345`).toString('base64');
      mockDbQuery.mockResolvedValueOnce({ rows: [] });

      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?code=${validCode}&state=${forgedState}`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toContain('Invalid or expired state');
    });

    it('returns 401 when state is expired (older than 10 minutes)', async () => {
      const oldTimestamp = Date.now() - 11 * 60 * 1000; // 11 minutes ago
      const expiredState = Buffer.from(`${devTenantId}:${oldTimestamp}`).toString('base64');

      mockDbQuery.mockResolvedValueOnce({
        rows: [
          {
            stored_state: expiredState,
            issued_at: new Date(oldTimestamp).toISOString(),
          },
        ],
      });

      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?code=${validCode}&state=${expiredState}`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toContain('Invalid or expired state');
    });

    it('returns 400 when state parameter is missing', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?code=${validCode}`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when code parameter is missing', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?state=${validState}`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when eBay returns an OAuth error', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/ebay/authorize?error=access_denied&error_description=User+denied+access`,
      );

      const res = await getAuthorize(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('OAuth error');
      expect(body.details?.error_description).toBe('User denied access');
    });
  });
});
