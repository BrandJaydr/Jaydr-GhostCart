import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AliExpressFetch,
  AliExpressTokenError,
  AliExpressTokenProvider,
} from '../../lib/adapters/aliexpress/token';

const APP_KEY = 'dummy-app-key';
const APP_SECRET = 'dummy-app-secret';
const ACCESS_TOKEN = 'dummy-access-token';
const REFRESH_TOKEN = 'dummy-refresh-token';
const ROTATED_ACCESS_TOKEN = 'dummy-rotated-access-token';
const ROTATED_REFRESH_TOKEN = 'dummy-rotated-refresh-token';
const NOW = new Date('2026-11-09T12:00:00.000Z');

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe('AliExpress OAuth token provider (GC-202)', () => {
  let fetchMock: ReturnType<typeof vi.fn<AliExpressFetch>>;

  beforeEach(() => {
    fetchMock = vi.fn<AliExpressFetch>();
  });

  function provider() {
    return new AliExpressTokenProvider({
      appKey: APP_KEY,
      appSecret: APP_SECRET,
      fetch: fetchMock,
      now: () => new Date(NOW),
    });
  }

  it('exchanges an authorization code and computes an absolute expiry', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN,
        expires_in: 86_400,
        refresh_expires_in: 172_800,
      }),
    );

    const result = await provider().exchangeAuthorizationCode('dummy-code');

    expect(result).toEqual({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresAt: new Date(NOW.getTime() + 86_400_000),
      refreshExpiresAt: new Date(NOW.getTime() + 172_800_000),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api-sg.aliexpress.com/auth/token/create');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'content-type': 'application/json',
      accept: 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      app_key: APP_KEY,
      app_secret: APP_SECRET,
      code: 'dummy-code',
    });
    expect(String(url)).not.toContain('?');
  });

  it('refreshes and returns the newly rotated access and refresh tokens', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: ROTATED_ACCESS_TOKEN,
        refresh_token: ROTATED_REFRESH_TOKEN,
        expires_in: 3_600,
      }),
    );

    const result = await provider().refreshAccessToken(REFRESH_TOKEN);

    expect(result).toEqual({
      accessToken: ROTATED_ACCESS_TOKEN,
      refreshToken: ROTATED_REFRESH_TOKEN,
      expiresAt: new Date(NOW.getTime() + 3_600_000),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api-sg.aliexpress.com/auth/token/refresh');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      app_key: APP_KEY,
      app_secret: APP_SECRET,
      refresh_token: REFRESH_TOKEN,
    });
    expect(String(url)).not.toContain('?');
  });

  it('refreshes a token with less than five minutes remaining', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: ROTATED_ACCESS_TOKEN,
        refresh_token: ROTATED_REFRESH_TOKEN,
        expires_in: 3_600,
      }),
    );

    const result = await provider().getValidToken({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresAt: new Date(NOW.getTime() + 4 * 60 * 1000),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe(ROTATED_ACCESS_TOKEN);
    expect(result.refreshToken).toBe(ROTATED_REFRESH_TOKEN);
  });

  it('does not refresh a token with five minutes or more remaining', async () => {
    const current = {
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresAt: new Date(NOW.getTime() + 5 * 60 * 1000),
    };

    const result = await provider().getValidToken(current);

    expect(result).toEqual(current);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('refreshes when the current token has no known expiry', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: ROTATED_ACCESS_TOKEN,
        refresh_token: ROTATED_REFRESH_TOKEN,
        expires_in: 3_600,
      }),
    );

    const result = await provider().getValidToken({
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      expiresAt: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe(ROTATED_ACCESS_TOKEN);
  });

  it('converts API error envelopes into safe typed errors', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        error_response: {
          code: 'dummy-error-code',
          msg: APP_SECRET,
          sub_msg: `${ACCESS_TOKEN} ${REFRESH_TOKEN}`,
        },
      }),
    );

    let thrown: unknown;
    try {
      await provider().exchangeAuthorizationCode('dummy-code');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AliExpressTokenError);
    expect((thrown as AliExpressTokenError).kind).toBe('api');
    const message = (thrown as Error).message;
    expect(message).not.toContain(APP_SECRET);
    expect(message).not.toContain(ACCESS_TOKEN);
    expect(message).not.toContain(REFRESH_TOKEN);
    expect(message).toBe('AliExpress token endpoint returned an API error');
  });

  it('fails closed when the app key is missing before making HTTP calls', () => {
    expect(
      () =>
        new AliExpressTokenProvider({
          appKey: '',
          appSecret: APP_SECRET,
          fetch: fetchMock,
        }),
    ).toThrow('ALIEXPRESS_APP_KEY');

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('fails closed when the app secret is missing before making HTTP calls', () => {
    expect(
      () =>
        new AliExpressTokenProvider({
          appKey: APP_KEY,
          appSecret: '',
          fetch: fetchMock,
        }),
    ).toThrow('ALIEXPRESS_APP_SECRET');

    expect(fetchMock).toHaveBeenCalledTimes(0);
  });
});
