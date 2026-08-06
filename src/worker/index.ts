/**
 * Worker Process Entrypoint — Stage 1 Stub
 *
 * Registers BullMQ workers that process async jobs from the queue.
 * Runs as a separate process: `npm run worker`
 *
 * Stage 1: Registers the import worker processor stub.
 * Stage 2: @agent:atlas Implement real importProduct logic in the processor.
 * Stage 3: @agent:atlas Add listingQueue worker for marketplace submission.
 *
 * Reference: Production Blueprint §3.1 — "single worker process and durable queue"
 */

import { Worker } from 'bullmq';
import { redis } from '@/lib/queue';

console.warn('[Worker] Starting GhostCart worker process...');

// ─── Product Import Worker ────────────────────────────────────────────────────
// @agent:atlas Implement job processor to call ISupplierAdapter.importProduct()
// @agent:atlas Add: tenant_id propagation, audit event creation, error classification

const importWorker = new Worker(
  'product.import',
  async (job) => {
    console.warn(`[Worker] Processing import job ${job.id} for tenant ${job.data.tenantId}`);

    // TODO: @agent:atlas Implement:
    // 1. Resolve supplier adapter from job.data.supplierId (adapter factory)
    // 2. Call adapter.importProduct(job.data.url, job.data.tenantId)
    // 3. Persist CanonicalProduct to products + product_sources tables
    // 4. Create audit_event for import completion
    // 5. Return { productId } for job result

    throw new Error(
      `[Worker] product.import processor not yet implemented — @agent:atlas Stage 2 task`,
    );
  },
  {
    connection: redis,
    concurrency: 5, // TODO: @agent:archivist tune based on DB pool size
  },
);

importWorker.on('completed', (job) => {
  console.warn(`[Worker] Import job ${job.id} completed`);
});

importWorker.on('failed', (job, err) => {
  console.error(`[Worker] Import job ${job?.id} failed:`, err.message);
  // TODO: @agent:atlas Write failure to jobs table and audit_events
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.warn('[Worker] Shutting down...');
  await importWorker.close();
  process.exit(0);
});
