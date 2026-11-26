/**
 * GC-303 — scheduled AliExpress token refresh.
 * Verifies expired-token rotation and that refresh failures raise an alert
 * without throwing out of the sweep (no crash loop).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AliExpressTokenError } from '../../lib/adapters/aliexpress/token';
import {
  processAliExpressTokenRefreshes,
  type TokenRefreshOptions,
} from '../../worker/aliexpress-token-refresh';

const { mockQuery, mockNotify } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
  mockNotify: vi.fn(),
}));

vi.mock('../../lib/db/index.js', () => ({ db: { query: mockQuery } }));
vi.mock('../../lib/alerts/index.js', () => ({ notify: mockNotify }));

const DUE_ROW = {
  id: 'conn-1',
  tenant_id: 'tenant-1',
  access_token: 'stale-access-token',
  refresh_token: 'dummy-refresh-token',
  token_expires_at: new Date('2026-11-26T09:00:00.000Z'),
};

const ROTATED = {
  accessToken: 'rotated-access-token',
  refreshToken: 'rotated-refresh-token',
  expiresAt: new Date('2026-11-26T13:00:00.000Z'),
};

function asOptions(
  provider: TokenRefreshOptions['provider'],
): TokenRefreshOptions {
  return {
    queryClient: { query: mockQuery } as unknown as TokenRefreshOptions['queryClient'],
    provider,
    notifier: mockNotify,
  };
}

describe('GC-303 AliExpress scheduled token refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes an expired token and persists the rotated pair', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [DUE_ROW], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const provider = { getValidToken: vi.fn().mockResolvedValue(ROTATED) };

    const outcomes = await processAliExpressTokenRefreshes(asOptions(provider));

    expect(String(mockQuery.mock.calls[0][0])).toContain(
      'FROM marketplace_connections',
    );
    expect(provider.getValidToken).toHaveBeenCalledWith({
      accessToken: DUE_ROW.access_token,
      refreshToken: DUE_ROW.refresh_token,
      expiresAt: DUE_ROW.token_expires_at,
    });
    expect(String(mockQuery.mock.calls[1][0])).toContain(
      'UPDATE marketplace_connections',
    );
    expect(mockQuery.mock.calls[1][1]).toEqual([
      DUE_ROW.id,
      ROTATED.accessToken,
      ROTATED.refreshToken,
      ROTATED.expiresAt,
      DUE_ROW.tenant_id,
    ]);
    expect(mockNotify).not.toHaveBeenCalled();
    expect(outcomes).toEqual([
      { connectionId: DUE_ROW.id, tenantId: DUE_ROW.tenant_id, status: 'refreshed' },
    ]);
  });

  it('raises an alert and resolves when a refresh fails', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [DUE_ROW], rowCount: 1 });
    mockNotify.mockResolvedValueOnce('alert-1');
    const provider = {
      getValidToken: vi.fn().mockRejectedValue(
        new AliExpressTokenError('api', 'AliExpress token endpoint returned an API error'),
      ),
    };

    const outcomes = await processAliExpressTokenRefreshes(asOptions(provider));

    expect(outcomes).toEqual([
      { connectionId: DUE_ROW.id, tenantId: DUE_ROW.tenant_id, status: 'failed' },
    ]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: DUE_ROW.tenant_id,
        alertType: 'aliexpress.token_refresh_failed',
        severity: 'critical',
        payload: expect.objectContaining({ errorKind: 'api' }),
      }),
    );
    expect(JSON.stringify(mockNotify.mock.calls[0][0])).not.toContain(
      DUE_ROW.refresh_token,
    );
  });

  it('contains one failed connection so the rest of the sweep still runs', async () => {
    const secondRow = { ...DUE_ROW, id: 'conn-2', tenant_id: 'tenant-2' };
    mockQuery
      .mockResolvedValueOnce({ rows: [DUE_ROW, secondRow], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    mockNotify.mockResolvedValue('alert-1');
    const provider = {
      getValidToken: vi
        .fn()
        .mockRejectedValueOnce(new AliExpressTokenError('network', 'network failure'))
        .mockResolvedValueOnce(ROTATED),
    };

    const outcomes = await processAliExpressTokenRefreshes(asOptions(provider));

    expect(provider.getValidToken).toHaveBeenCalledTimes(2);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      'failed',
      'refreshed',
    ]);
  });
});
