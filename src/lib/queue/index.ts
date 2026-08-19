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
 * TODO: @agent:archivist Configure job retry options, backoff strategy, and TTL
 * TODO: @agent:archivist Add Bull Board dashboard for queue monitoring (Stage 4+)
 * TODO: @agent:atlas Add job types with typed payloads (see canonical.ts JobType)
 * TODO: @agent:scout Monitor queue depth and processing lag (Stage 4+)
 */

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required.');
}

/** Shared Redis connection for BullMQ */
export const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

/** Queue for product import jobs — enqueued by POST /api/products */
export const importQueue = new Queue('product.import', {
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
});

/** Queue for listing submission jobs — enqueued by POST /api/listings/[id]/submit (Stage 3+) */
export const listingQueue = new Queue('listing.submit', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});

/** Queue for product refresh jobs — enqueued by on-demand refresh or scheduled sync */
export const refreshQueue = new Queue('product.refresh', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2_000,
    },
    removeOnComplete: { age: 24 * 3600 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});

/** Queue for automated periodic sync scheduling */
export const syncSchedulerQueue = new Queue('product.sync_scheduler', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 10_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 100 },
  },
});

/**
 * Register repeatable periodic sync cron
 */
export async function registerRepeatableSyncJobs(): Promise<void> {
  try {
    const pattern = process.env.SYNC_INTERVAL_CRON || '*/30 * * * *';
    await syncSchedulerQueue.add(
      'schedule-active-sync',
      { timestamp: Date.now() },
      {
        repeat: {
          pattern,
        },
        jobId: 'product-sync-scheduler-cron',
      },
    );
  } catch (err) {
    console.error('[queue] Failed to register repeatable sync jobs:', err);
  }
}

