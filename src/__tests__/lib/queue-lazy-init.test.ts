import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// #125: importing src/lib/queue must never throw when REDIS_URL is unset.
// The real clients are mocked so the test never opens a Redis connection.
const { mockRedisCtor, mockQueueCtor } = vi.hoisted(() => ({
  mockRedisCtor: vi.fn(),
  mockQueueCtor: vi.fn(),
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    connect = vi.fn();
    disconnect = vi.fn();
    duplicate = vi.fn();
    pipeline = vi.fn();

    constructor(url: string, options: unknown) {
      mockRedisCtor(url, options);
    }
  },
}));

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = vi.fn();

    constructor(name: string, options: unknown) {
      mockQueueCtor(name, options);
    }
  },
}));

describe('src/lib/queue — lazy initialization (#125)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockRedisCtor.mockClear();
    mockQueueCtor.mockClear();
    process.env = { ...originalEnv };
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('imports cleanly with REDIS_URL unset and creates no clients', async () => {
    const queue = await import('@/lib/queue/index');

    expect(queue.redis).toBeDefined();
    expect(queue.importQueue).toBeDefined();
    expect(queue.refreshQueue).toBeDefined();
    expect(queue.listingQueue).toBeDefined();
    expect(mockRedisCtor).not.toHaveBeenCalled();
    expect(mockQueueCtor).not.toHaveBeenCalled();
  });

  it('raises a clear configuration error on first use when REDIS_URL is unset', async () => {
    const { redis, importQueue, refreshQueue, listingQueue } = await import('@/lib/queue/index');

    expect(() => redis.pipeline()).toThrow(/REDIS_URL/);
    expect(() => importQueue.add('job', {})).toThrow(/REDIS_URL/);
    expect(() => refreshQueue.add('job', {})).toThrow(/REDIS_URL/);
    expect(() => listingQueue.add('job', {})).toThrow(/REDIS_URL/);
    expect(mockRedisCtor).not.toHaveBeenCalled();
    expect(mockQueueCtor).not.toHaveBeenCalled();
  });

  it('constructs each client once, on first use, when REDIS_URL is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const { redis, importQueue, refreshQueue, listingQueue } = await import('@/lib/queue/index');

    expect(mockRedisCtor).not.toHaveBeenCalled();
    expect(mockQueueCtor).not.toHaveBeenCalled();

    expect(typeof importQueue.add).toBe('function');
    expect(mockQueueCtor).toHaveBeenCalledTimes(1);
    expect(mockQueueCtor).toHaveBeenCalledWith(
      'product.import',
      expect.objectContaining({ connection: expect.anything() }),
    );
    expect(typeof importQueue.add).toBe('function');
    expect(mockQueueCtor).toHaveBeenCalledTimes(1);

    expect(typeof redis.pipeline).toBe('function');
    expect(mockRedisCtor).toHaveBeenCalledTimes(1);
    expect(mockRedisCtor).toHaveBeenCalledWith(
      'redis://localhost:6379',
      expect.objectContaining({ maxRetriesPerRequest: null }),
    );
    expect(typeof redis.pipeline).toBe('function');
    expect(mockRedisCtor).toHaveBeenCalledTimes(1);

    expect(typeof refreshQueue.add).toBe('function');
    expect(typeof listingQueue.add).toBe('function');
    expect(mockQueueCtor).toHaveBeenCalledTimes(3);
  });
});
