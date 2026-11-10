const TOKEN_API_BASE = 'https://api-sg.aliexpress.com';
const REFRESH_SKEW_MS = 5 * 60 * 1000;

export type AliExpressTokenErrorKind =
  | 'configuration'
  | 'invalid_argument'
  | 'network'
  | 'http'
  | 'api'
  | 'invalid_response';

export class AliExpressTokenError extends Error {
  readonly kind: AliExpressTokenErrorKind;
  readonly statusCode?: number;

  constructor(
    kind: AliExpressTokenErrorKind,
    message: string,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'AliExpressTokenError';
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

export interface AliExpressToken {
  accessToken: string;
  refreshToken: string;
  /** Absolute access-token expiry, derived from expires_in. */
  expiresAt: Date;
  /** Absolute refresh-token expiry when refresh_expires_in is supplied. */
  refreshExpiresAt?: Date;
}

export interface CurrentAliExpressToken {
  accessToken: string;
  refreshToken: string;
  /** Null means the expiry is unknown and a refresh is required. */
  expiresAt: Date | null;
  refreshExpiresAt?: Date | null;
}

export type AliExpressFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface AliExpressTokenProviderOptions {
  appKey?: string;
  appSecret?: string;
  fetch?: AliExpressFetch;
  now?: () => Date;
}

interface TokenApiResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  refresh_expires_in?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveSeconds(value: unknown): number | undefined {
  const seconds = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * AliExpress OAuth token provider.
 *
 * App credentials are read once at construction and are only sent in HTTPS
 * POST JSON bodies. This module never logs credentials or token material and
 * deliberately has no persistence or database dependency.
 */
export class AliExpressTokenProvider {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly fetcher: AliExpressFetch;
  private readonly now: () => Date;

  constructor(options: AliExpressTokenProviderOptions = {}) {
    const appKey = options.appKey ?? process.env.ALIEXPRESS_APP_KEY;
    const appSecret = options.appSecret ?? process.env.ALIEXPRESS_APP_SECRET;

    if (!appKey?.trim()) {
      throw new AliExpressTokenError(
        'configuration',
        'Missing required configuration: ALIEXPRESS_APP_KEY',
      );
    }

    if (!appSecret?.trim()) {
      throw new AliExpressTokenError(
        'configuration',
        'Missing required configuration: ALIEXPRESS_APP_SECRET',
      );
    }

    this.appKey = appKey;
    this.appSecret = appSecret;
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? (() => new Date());
  }

  /** Exchange an OAuth authorization code for access and refresh tokens. */
  async exchangeAuthorizationCode(code: string): Promise<AliExpressToken> {
    if (!code?.trim()) {
      throw new AliExpressTokenError(
        'invalid_argument',
        'An OAuth authorization code is required',
      );
    }

    return this.requestToken('/auth/token/create', {
      app_key: this.appKey,
      app_secret: this.appSecret,
      code,
    });
  }

  /** Exchange the current refresh token for a new pair of tokens. */
  async refreshAccessToken(refreshToken: string): Promise<AliExpressToken> {
    if (!refreshToken?.trim()) {
      throw new AliExpressTokenError(
        'invalid_argument',
        'A refresh token is required',
      );
    }

    return this.requestToken('/auth/token/refresh', {
      app_key: this.appKey,
      app_secret: this.appSecret,
      refresh_token: refreshToken,
    });
  }

  /**
   * Return a token with at least five minutes remaining, otherwise refresh it.
   * A missing or invalid expiry is treated as requiring refresh, matching
   * migration 0006's needs_token_refresh(connection_id) rule.
   */
  async getValidToken(
    current: CurrentAliExpressToken,
  ): Promise<AliExpressToken> {
    const expiresAt = current.expiresAt?.getTime();
    const refreshThreshold = this.now().getTime() + REFRESH_SKEW_MS;

    if (
      expiresAt !== undefined &&
      Number.isFinite(expiresAt) &&
      expiresAt >= refreshThreshold
    ) {
      return {
        accessToken: current.accessToken,
        refreshToken: current.refreshToken,
        expiresAt: new Date(expiresAt),
        ...(current.refreshExpiresAt
          ? { refreshExpiresAt: new Date(current.refreshExpiresAt) }
          : {}),
      };
    }

    return this.refreshAccessToken(current.refreshToken);
  }

  private async requestToken(
    path: '/auth/token/create' | '/auth/token/refresh',
    body: Record<string, string>,
  ): Promise<AliExpressToken> {
    let response: Response;

    try {
      response = await this.fetcher(`${TOKEN_API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      // Do not propagate fetch errors: implementations may include request
      // details, and the request body contains the transient app secret.
      throw new AliExpressTokenError(
        'network',
        'AliExpress token request failed before a response was received',
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AliExpressTokenError(
        'invalid_response',
        'AliExpress token endpoint returned an unreadable response',
        response.status,
      );
    }

    if (!response.ok) {
      throw new AliExpressTokenError(
        'http',
        `AliExpress token endpoint returned HTTP ${response.status}`,
        response.status,
      );
    }

    if (!isRecord(payload)) {
      throw new AliExpressTokenError(
        'invalid_response',
        'AliExpress token endpoint returned an unexpected response',
        response.status,
      );
    }

    if (
      payload.error !== undefined ||
      payload.error_response !== undefined ||
      payload.success === false
    ) {
      throw new AliExpressTokenError(
        'api',
        'AliExpress token endpoint returned an API error',
        response.status,
      );
    }

    const tokenPayload = isRecord(payload.data)
      ? (payload.data as TokenApiResponse)
      : (payload as TokenApiResponse);

    const accessToken = tokenPayload.access_token;
    const refreshToken = tokenPayload.refresh_token;
    const expiresIn = positiveSeconds(tokenPayload.expires_in);
    const refreshExpiresIn = positiveSeconds(
      tokenPayload.refresh_expires_in,
    );

    if (
      typeof accessToken !== 'string' ||
      accessToken.length === 0 ||
      typeof refreshToken !== 'string' ||
      refreshToken.length === 0 ||
      expiresIn === undefined
    ) {
      throw new AliExpressTokenError(
        'invalid_response',
        'AliExpress token endpoint omitted required token fields',
        response.status,
      );
    }

    const receivedAt = this.now().getTime();

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(receivedAt + expiresIn * 1000),
      ...(refreshExpiresIn !== undefined
        ? { refreshExpiresAt: new Date(receivedAt + refreshExpiresIn * 1000) }
        : {}),
    };
  }
}
