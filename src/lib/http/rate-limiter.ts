import type IORedis from 'ioredis';

export interface HostRateLimitConfig {
  maxRequestsPerInterval?: number;
  intervalMs?: number;
  minDelayBetweenRequestsMs?: number;
}

const DEFAULT_LIMIT: HostRateLimitConfig = {
  maxRequestsPerInterval: 2,
  intervalMs: 1000,
  minDelayBetweenRequestsMs: 300,
};

const HOST_CUSTOM_LIMITS: Record<string, HostRateLimitConfig> = {
  'aliexpress.com': { maxRequestsPerInterval: 2, intervalMs: 1000, minDelayBetweenRequestsMs: 500 },
  'www.aliexpress.com': { maxRequestsPerInterval: 2, intervalMs: 1000, minDelayBetweenRequestsMs: 500 },
  'api.ebay.com': { maxRequestsPerInterval: 5, intervalMs: 1000, minDelayBetweenRequestsMs: 200 },
  'api.sandbox.ebay.com': { maxRequestsPerInterval: 5, intervalMs: 1000, minDelayBetweenRequestsMs: 200 },
};

/**
 * In-memory fallback timestamp tracker for per-host throttling
 */
const inMemoryLastRequestTimes = new Map<string, number>();

/**
 * HostRateLimiter
 * Ensures polite crawling and API compliance per target domain.
 */
export class HostRateLimiter {
  private readonly redisClient?: IORedis;

  constructor(redisClient?: IORedis) {
    this.redisClient = redisClient;
  }

  /**
   * Acquire a slot for a given hostname.
   * Delays execution if the hostname is being queried too rapidly.
   * @returns delayMs waited before execution
   */
  async acquire(hostname: string): Promise<number> {
    const cleanHost = hostname.toLowerCase();
    const config = HOST_CUSTOM_LIMITS[cleanHost] || DEFAULT_LIMIT;
    const minDelay = config.minDelayBetweenRequestsMs || 300;

    const now = Date.now();
    const lastTime = inMemoryLastRequestTimes.get(cleanHost) || 0;
    const elapsed = now - lastTime;

    let waitTimeMs = 0;
    if (elapsed < minDelay) {
      waitTimeMs = minDelay - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
    }

    inMemoryLastRequestTimes.set(cleanHost, Date.now());

    // If Redis is configured, track host request rate
    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const key = `ratelimit:host:${cleanHost}`;
        await this.redisClient.incr(key);
        await this.redisClient.pexpire(key, config.intervalMs || 1000);
      } catch {
        // Fallback gracefully on Redis failure
      }
    }

    return waitTimeMs;
  }

  /**
   * Reset tracking state (useful for testing)
   */
  clear(): void {
    inMemoryLastRequestTimes.clear();
  }
}

export const hostRateLimiter = new HostRateLimiter();
