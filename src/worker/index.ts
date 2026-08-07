/**
 * Worker Process Entrypoint — Stage 1 Stub
 *
 * Registers BullMQ workers that process async jobs from the queue.
 * Runs as a separate process: `npm run worker`
 *
 * Stage 1: Registers the `product.import` worker; the processor resolves the
 *          supplier adapter, normalizes the product, and persists it with
 *          graceful degradation (logs + completes instead of retry-looping).
 * Stage 2: @agent:atlas Tighten retry-on-transient-error + dead-letter queue.
 * Stage 3: @agent:atlas Add listingQueue worker for marketplace submission.
 *
 * Reference: Production Blueprint §3.1 — "single worker process and durable queue"
 */

import { Worker, type Job } from 'bullmq';
import { redis } from '@/lib/queue';
import { db } from '@/lib/db';
import { getSupplierAdapter } from '@/lib/adapters/factory';
import type { CanonicalProduct } from '@/lib/types/canonical';
import { randomUUID } from 'node:crypto';

console.warn('[Worker] Starting GhostCart worker process...');

/**
 * Persistence helpers for the product.import worker.
 *
 * @agent:archivist These assume @agent:archivist completes the 0001_init.sql
 * TODOs (seeded tenant/supplier rows, RLS, CHECK constraints, indexes). Any
 * persistence failure is caught so the worker still returns the normalized
 * product (graceful degradation — Option C) instead of retry-looping BullMQ.
 */

interface PersistContext {
  jobId?: string | undefined;
  tenantId: string;
  idempotencyKey: string;
}

/** Persist a normalized CanonicalProduct to PostgreSQL within a transaction. */
async function persistImport(
  product: CanonicalProduct,
  ctx: PersistContext,
): Promise<void> {
  const productId = randomUUID();
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Core product record (canonical fields → existing migration columns).
    await client.query(
      `INSERT INTO products
         (id, tenant_id, title, description, supplier_price_cents, currency,
          availability, primary_image_url, imported_at, last_refreshed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        productId,
        product.tenantId,
        product.title,
        product.description,
        product.supplierPriceCents,
        product.currency,
        product.availability,
        product.primaryImageUrl,
        product.importedAt,
        product.lastRefreshedAt,
      ],
    );

    // TODO: @agent:archivist product_sources insert is deferred until the
    // suppliers registry is seeded. The canonical `supplierId` is the adapterId
    // (text), but `product_sources.supplier_id` is a UUID FK → `suppliers.id`.
    // Mapping a supplier adapter to a suppliers row belongs in Stage 2 once the
    // tenant's supplier accounts are configured.

    // Jobs table: upsert by idempotency_key (dedup).
    await client.query(
      `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts,
          last_error, created_at, completed_at)
       VALUES ($1, $2, 'product.import', $3, $4, 'completed', 0, NULL, now(), now())
       ON CONFLICT (idempotency_key) DO UPDATE
         SET status = 'completed', completed_at = now(), last_error = NULL`,
      [
        randomUUID(),
        product.tenantId,
        JSON.stringify({
          jobId: ctx.jobId,
          productId,
          url: product.sourceUrl,
          supplierId: product.supplierId,
        }),
        ctx.idempotencyKey,
      ],
    );

    // Audit event — immutable (INSERT only, per Production Blueprint §6.1).
    await client.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'product.imported', 'products', $2, $3, now())`,
      [
        product.tenantId,
        productId,
        JSON.stringify({ url: product.sourceUrl, supplierId: product.supplierId }),
      ],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/** Record a failed import job in audit_events + jobs tables (best-effort). */
async function recordJobFailure(
  job: Job | undefined,
  errorMessage: string,
): Promise<void> {
  if (!job) {
    console.error('[Worker] Import job failed with no job reference:', errorMessage);
    return;
  }
  const { tenantId, idempotencyKey, supplierId, url } = job.data ?? {};
  try {
    await db.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'product.import_failed', 'jobs', NULL, $2, now())
       ON CONFLICT DO NOTHING`,
      [
        tenantId,
        JSON.stringify({
          bullJobId: job.id,
          supplierId,
          url,
          error: errorMessage,
          attempts: job.attemptsMade,
        }),
      ],
    );
  } catch {
    /* DB unavailable — log below */
  }
  try {
    await db.query(
      `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts,
          last_error, created_at, completed_at)
       VALUES ($1, $2, 'product.import', '{}', $3, 'failed', $4, $5, now(), now())
       ON CONFLICT (idempotency_key) DO UPDATE
         SET status = 'failed', last_error = $5, attempts = jobs.attempts + 1`,
      [
        randomUUID(),
        tenantId,
        idempotencyKey,
        job.attemptsMade ?? 0,
        errorMessage,
      ],
    );
  } catch (err) {
    console.error('[Worker] Could not record job failure in DB:', (err as Error).message);
  }
}

// ─── Product Import Worker ────────────────────────────────────────────────────
// @agent:atlas Implement job processor to call ISupplierAdapter.importProduct()
// @agent:atlas Add: tenant_id propagation, audit event creation, error classification

const importWorker = new Worker(
  'product.import',
  async (job) => {
    const { url, supplierId, tenantId, idempotencyKey } = job.data;

    // 1. Resolve supplier adapter via the factory (@agent:atlas handoff).
    const adapter = getSupplierAdapter(supplierId);
    if (!adapter) {
      throw new Error(`Unknown supplier adapter: ${supplierId}`);
    }

    // 2. Import & normalize to a CanonicalProduct.
    const product = await adapter.importProduct(url, tenantId);

    // 3. Persist — graceful degradation (Option C). If Postgres is unavailable
    //    or @agent:archivist's schema TODOs aren't complete yet, the import
    //    result is still returned so the job doesn't retry-loop.
    let persisted = true;
    try {
      await persistImport(product, { jobId: job.id, tenantId, idempotencyKey });
    } catch (err) {
      persisted = false;
      const msg = `DB persistence failed for import ${job.id ?? '?'}: ${(err as Error).message}`;
      console.error(`[Worker] ${msg}`);
      // Best-effort audit of the persistence failure (won't throw if DB is down).
      try {
        await db.query(
          `INSERT INTO audit_events
             (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
           VALUES ($1, NULL, 'product.import_failed', 'products', NULL, $2, now())`,
          [tenantId, JSON.stringify({ jobId: job.id, supplierId, url, error: msg })],
        );
      } catch {
        /* DB unavailable — nothing more to do; result is in the job payload */
      }
    }

    // 4. Result — always returned (graceful degradation per Option C).
    return { productId: product.id, persisted };
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
  void recordJobFailure(job, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.warn('[Worker] Shutting down...');
  await importWorker.close();
  process.exit(0);
});
