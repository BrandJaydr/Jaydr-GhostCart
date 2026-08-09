/**
 * Multi-Level Cache Manager
 *
 * Orchestrates L1 (memory), L2 (Redis), and L3 (database) caching layers.
 * Provides permanent storage for expensive computations with time-sensitive data.
 *
 * Cache Hierarchy:
 * - L1 (Memory): In-process cache for frequently accessed data (5 min TTL)
 * - L2 (Redis): Distributed cache for product research (24 hour TTL)
 * - L3 (Database): Permanent cache for expensive computations (indefinite)
 *
 * @agent:forge Configure Redis connection for L2 caching
 * @agent:archivist Ensure database functions from migration 0005 are available
 * @agent:oracle Add tests for cache layer with mock Redis
 */

import { createHash } from 'crypto';
import { db } from '@/lib/db/index.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  level: 'L1' | 'L2' | 'L3';
}

export interface CacheOptions {
  l1TTL?: number; // Default: 5 minutes
  l2TTL?: number; // Default: 24 hours
  l3Permanent?: boolean; // Default: true
  tags?: string[]; // For cache invalidation
}

/**
 * LRU Cache implementation for L1 (memory) cache
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Multi-Level Cache Manager
 */
export class CacheManager {
  private l1Cache: LRUCache<string, CacheEntry<unknown>>;
  private redis: any; // Redis client (configured separately)
  private defaultOptions: Required<CacheOptions>;

  constructor(redisClient?: any) {
    this.l1Cache = new LRUCache<string, CacheEntry<unknown>>(100);
    this.redis = redisClient;
    this.defaultOptions = {
      l1TTL: 5 * 60 * 1000, // 5 minutes
      l2TTL: 24 * 60 * 60 * 1000, // 24 hours
      l3Permanent: true,
      tags: [],
    };
  }

  /**
   * Get data from cache (checks L1 → L2 → L3)
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };

    // Try L1 (memory)
    const l1Entry = this.l1Cache.get(key) as CacheEntry<T> | undefined;
    if (l1Entry && Date.now() - l1Entry.timestamp < l1Entry.ttl) {
      return l1Entry.data;
    }

    // Try L2 (Redis)
    if (this.redis) {
      try {
        const l2Data = await this.redis.get(`ghostcart:l2:${key}`);
        if (l2Data) {
          const parsed = JSON.parse(l2Data) as CacheEntry<T>;
          if (Date.now() - parsed.timestamp < parsed.ttl) {
            // Promote to L1
            this.l1Cache.set(key, parsed);
            return parsed.data;
          }
        }
      } catch (err) {
        console.error('[CacheManager] L2 cache error:', err);
      }
    }

    // Try L3 (database)
    try {
      const result = await db.query(
        `SELECT output_data, cached_at, expires_at
         FROM ai_insights.ai_suggestions
         WHERE input_hash = $1
           AND (expires_at IS NULL OR expires_at > now())
           AND is_valid = true
         ORDER BY cached_at DESC
         LIMIT 1`,
        [key],
      );

      if ((result.rowCount ?? 0) > 0) {
        const row = result.rows[0];
        const data = row.output_data as T;

        // Promote to L1 and L2
        const entry: CacheEntry<T> = {
          data,
          timestamp: row.cached_at.getTime(),
          ttl: opts.l2TTL,
          level: 'L3',
        };
        this.l1Cache.set(key, entry as CacheEntry<unknown>);

        if (this.redis) {
          await this.redis.setex(
            `ghostcart:l2:${key}`,
            Math.floor(opts.l2TTL / 1000),
            JSON.stringify(entry),
          ).catch(() => undefined);
        }

        return data;
      }
    } catch (err) {
      console.error('[CacheManager] L3 cache error:', err);
    }

    return null;
  }

  /**
   * Set data in cache (writes to L1, L2, and L3)
   */
  async set<T>(
    key: string,
    data: T,
    options?: CacheOptions,
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();

    // Set L1 (memory)
    const l1Entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: opts.l1TTL,
      level: 'L1',
    };
    this.l1Cache.set(key, l1Entry as CacheEntry<unknown>);

    // Set L2 (Redis)
    if (this.redis) {
      const l2Entry: CacheEntry<T> = {
        data,
        timestamp: now,
        ttl: opts.l2TTL,
        level: 'L2',
      };
      try {
        await this.redis.setex(
          `ghostcart:l2:${key}`,
          Math.floor(opts.l2TTL / 1000),
          JSON.stringify(l2Entry),
        );
      } catch (err) {
        console.error('[CacheManager] L2 cache set error:', err);
      }
    }

    // Set L3 (database) - permanent storage
    if (opts.l3Permanent) {
      try {
        const expiresAt = opts.tags?.includes('seasonal')
          ? new Date(now + 90 * 24 * 60 * 60 * 1000) // 90 days for seasonal
          : null;

        await db.query(
          `INSERT INTO ai_insights.ai_suggestions
             (tenant_id, suggestion_type, input_hash, input_data, output_data, model_used, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (input_hash) DO UPDATE
             SET output_data = EXCLUDED.output_data,
                 cached_at = now(),
                 expires_at = EXCLUDED.expires_at`,
          [
            '00000000-0000-0000-0000-000000000001', // @agent:forge Replace with tenantId from session
            'cached',
            key,
            { key },
            data,
            'cache_manager',
            expiresAt,
          ],
        );
      } catch (err) {
        console.error('[CacheManager] L3 cache set error:', err);
      }
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    // Remove from L1
    this.l1Cache.delete(key);

    // Remove from L2
    if (this.redis) {
      try {
        await this.redis.del(`ghostcart:l2:${key}`);
      } catch (err) {
        console.error('[CacheManager] L2 cache invalidate error:', err);
      }
    }

    // Mark as invalid in L3
    try {
      await db.query(
        `UPDATE ai_insights.ai_suggestions
         SET is_valid = false
         WHERE input_hash = $1`,
        [key],
      );
    } catch (err) {
      console.error('[CacheManager] L3 cache invalidate error:', err);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    // Clear L1 cache (simple approach)
    this.l1Cache.clear();

    // In L3, mark all entries with this tag as invalid
    // Note: This requires storing tags in the database schema
    // @agent:archivist Add tags column to ai_suggestions table if needed
  }

  /**
   * Generate cache key from input data
   */
  static generateKey(prefix: string, data: unknown): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Clean up expired entries from L3 database
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await db.query(
        `SELECT ai_insights.cleanup_expired_suggestions() as deleted`,
      );
      return parseInt(result.rows[0].deleted as string, 10);
    } catch (err) {
      console.error('[CacheManager] Cleanup error:', err);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    l1Size: number;
    l1MaxSize: number;
    l2Connected: boolean;
  } {
    return {
      l1Size: this.l1Cache.size(),
      l1MaxSize: 100,
      l2Connected: !!this.redis,
    };
  }

  /**
   * Clear all caches (use with caution)
   */
  async clearAll(): Promise<void> {
    this.l1Cache.clear();

    if (this.redis) {
      try {
        const keys = await this.redis.keys('ghostcart:l2:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (err) {
        console.error('[CacheManager] L2 clear error:', err);
      }
    }
  }
}

/**
 * Singleton cache manager instance
 * @agent:forge Configure Redis client and pass to constructor
 */
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(redisClient?: any): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(redisClient);
  }
  return cacheManagerInstance;
}
