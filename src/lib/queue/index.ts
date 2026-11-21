import { Queue } from 'bullmq';
import IORedis from 'ioredis';

/**
 * BullMQ Queue Configuration — Stage 1 Stub
 *
 * Durable job queue backed by Redis. Provides the async import pipeline
 * between the API layer and the worker process.
 *
 * Architecture decision: BullMQ (not Kafka) per Blueprint §3.2 deferral.
 * Kafka/RabbitMQ only when throughput, replay, or multi-consumer needs emerge.
 *
 * The queue and its connection are created lazily on first use. Importing this
 * module must never throw: API routes, the worker, and test files all import it,
 * and a missing REDIS_URL used to crash the module before anything could run
 * (#125 / ERR-066). The configuration error is raised where it is actionable —
 * the first attempt to enqueue or use the connection.
 *
 * TODO: @agent:archivist Configure job retry options, backoff strategy, and TTL
 * TODO: @agent:archivist Add Bull Board dashboard for queue monitoring (Stage 4+)
 * TODO: @agent:atlas Add job types with typed payloads (see canonical.ts JobType)
 * TODO: @agent:scout Monitor queue depth and processing lag (Stage 4+)
 */

const REDIS_URL_ERROR =
  'REDIS_URL environment variable is required to use the job queue. Set REDIS_URL before starting the API server or the worker.';

function requireRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(REDIS_URL_ERROR);
  }
  return url;
}

/** Every queue needs the connection, so validate on first use rather than relying on BullMQ to touch it. */
function createQueue(name: string, options: ConstructorParameters<typeof Queue>[1]): Queue {
  requireRedisUrl();
  return new Queue(name, options);
}

/**
 * Expose a singleton through a proxy so the factory runs on first property
 * access, not at module load. Methods are bound to the real instance because
 * ioredis and BullMQ rely on `this` being the client they created.
 */
function lazy<T extends object>(factory: () => T): T {
  let instance: T | undefined;

  const resolve = (): T => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };

  return new Proxy({} as T, {
    get(_target, prop) {
      const real = resolve();
      const value = Reflect.get(real, prop) as unknown;
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(real) : value;
    },
    set(_target, prop, value) {
      return Reflect.set(resolve(), prop, value);
    },
    has(_target, prop) {
      return Reflect.has(resolve(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(resolve());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(resolve(), prop);
      return descriptor ? { ...descriptor, configurable: true } : descriptor;
    },
  });
}

/** Shared Redis connection for BullMQ — created on first use. */
export const redis = lazy(
  () =>
    new IORedis(requireRedisUrl(), {
      maxRetriesPerRequest: null, // Required by BullMQ
    }),
);

/** Queue for product import jobs — enqueued by POST /api/products */
export const importQueue = lazy(
  () =>
    createQueue('product.import', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2_000,
        },
        // TODO: @agent:archivist Review TTL for completed/failed jobs
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
);

/** Queue for product refresh jobs — enqueued by scheduled refreshes (GC-301) */
export const refreshQueue = lazy(
  () =>
    createQueue('product.refresh', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
);

/** Queue for listing submission jobs — enqueued by POST /api/listings/[id]/submit (Stage 3+) */
export const listingQueue = lazy(
  () =>
    createQueue('listing.submit', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
);
