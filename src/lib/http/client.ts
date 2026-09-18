import { createHash } from 'crypto';
import type IORedis from 'ioredis';
import { logger } from '@/lib/logger';
import { hostRateLimiter, type HostRateLimiter } from './rate-limiter';

export interface HttpRequestOptions extends RequestInit {
  useCache?: boolean;
  cacheTtlSeconds?: number;
  maxContentLengthBytes?: number;
  skipRateLimiting?: boolean;
  correlationId?: string;
}

export interface HttpResponse<T = string> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  cached: boolean;
  durationMs: number;
  throttleDelayMs: number;
}

/**
 * In-memory response cache fallback
 */
interface CacheEntry {
  data: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  expiresAt: number;
}
const inMemoryCache = new Map<string, CacheEntry>();

export class HttpClient {
  private readonly rateLimiter: HostRateLimiter;
  private readonly redisClient?: IORedis;
  private readonly defaultMaxContentLengthBytes: number;

  constructor(options?: {
    rateLimiter?: HostRateLimiter;
    redisClient?: IORedis;
    defaultMaxContentLengthBytes?: number;
  }) {
    this.rateLimiter = options?.rateLimiter || hostRateLimiter;
    this.redisClient = options?.redisClient;
    this.defaultMaxContentLengthBytes = options?.defaultMaxContentLengthBytes || 5 * 1024 * 1024; // 5 MB default
  }

  private generateCacheKey(url: string, method = 'GET'): string {
    const hash = createHash('sha256').update(`${method}:${url}`).digest('hex');
    return `http:cache:${hash}`;
  }

  async get<T = string>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = string>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    const headers = new Headers(options?.headers);
    let serializedBody: string | undefined;

    if (body !== undefined) {
      if (typeof body === 'string') {
        serializedBody = body;
      } else {
        serializedBody = JSON.stringify(body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }
    }

    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: serializedBody,
      headers,
    });
  }

  async request<T = string>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    const method = (options?.method || 'GET').toUpperCase();
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const useCache = options?.useCache ?? (method === 'GET');
    const cacheKey = this.generateCacheKey(url, method);
    const maxBytes = options?.maxContentLengthBytes ?? this.defaultMaxContentLengthBytes;

    // 1. Check Cache
    if (useCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        const durationMs = Date.now() - startTime;
        logger.debug('HTTP', `[Cache HIT] ${method} ${url}`, {
          host,
          durationMs,
          cached: true,
        });
        return {
          data: (typeof cached.data === 'string' ? cached.data : JSON.stringify(cached.data)) as unknown as T,
          status: cached.status,
          statusText: cached.statusText,
          headers: new Headers(cached.headers),
          cached: true,
          durationMs,
          throttleDelayMs: 0,
        };
      }
    }

    // 2. Apply Host Throttling
    let throttleDelayMs = 0;
    if (!options?.skipRateLimiting) {
      throttleDelayMs = await this.rateLimiter.acquire(host);
      if (throttleDelayMs > 0) {
        logger.debug('HTTP', `[Throttled ${throttleDelayMs}ms] ${host} before ${method} ${url}`);
      }
    }

    // 3. Prepare Headers
    const headers = new Headers(options?.headers);
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', 'GhostCart-SyncBot/1.0 (+https://ghostcart.local/bot)');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8');
    }

    // 4. Execute Fetch
    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
      });

      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxBytes) {
        throw new Error(`Response size ${contentLengthHeader} bytes exceeds limit of ${maxBytes} bytes`);
      }

      const responseText = await response.text();
      if (Buffer.byteLength(responseText, 'utf8') > maxBytes) {
        throw new Error(`Response content exceeded limit of ${maxBytes} bytes`);
      }

      const durationMs = Date.now() - startTime;

      logger.debug('HTTP', `[Fetch ${response.status}] ${method} ${url}`, {
        status: response.status,
        durationMs,
        throttleDelayMs,
        bytes: Buffer.byteLength(responseText, 'utf8'),
      });

      // 5. Store Cache if successful GET
      if (useCache && response.ok) {
        const ttl = options?.cacheTtlSeconds ?? 300; // 5 min default
        const headersRecord: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          headersRecord[k] = v;
        });

        await this.setCache(cacheKey, {
          data: responseText,
          status: response.status,
          statusText: response.statusText,
          headers: headersRecord,
          expiresAt: Date.now() + ttl * 1000,
        }, ttl);
      }

      return {
        data: responseText as unknown as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        cached: false,
        durationMs,
        throttleDelayMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error('HTTP', `[Fetch Error] ${method} ${url}`, {
        error: (err as Error).message,
        durationMs,
      });
      throw err;
    }
  }

  private async getFromCache(key: string): Promise<CacheEntry | null> {
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) return JSON.parse(raw) as CacheEntry;
      } catch {
        // Fall back to memory cache on Redis error
      }
    }

    const mem = inMemoryCache.get(key);
    if (mem && mem.expiresAt > Date.now()) {
      return mem;
    }
    if (mem && mem.expiresAt <= Date.now()) {
      inMemoryCache.delete(key);
    }
    return null;
  }

  private async setCache(key: string, entry: CacheEntry, ttlSeconds: number): Promise<void> {
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        await this.redisClient.set(key, JSON.stringify(entry), 'EX', ttlSeconds);
        return;
      } catch {
        // Fall back to memory cache
      }
    }

    inMemoryCache.set(key, entry);
  }

  clearMemoryCache(): void {
    inMemoryCache.clear();
  }
}

export const httpClient = new HttpClient();
