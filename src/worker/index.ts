/**
 * Worker Process Entrypoint — Stage 2
 *
 * Registers BullMQ workers that process async jobs from the queue.
 * Runs as a separate process: `npm run worker`
 *
 * Stage 1: Registered `product.import`; processor resolved the supplier adapter,
 *          normalized the product, and persisted it with graceful degradation.
 * Stage 2: Added `product_sources` traceability, review-before-use gate +
 *          import instrumentation on persisting products, dead-letter queue
 *          dispatch on final failure, and a `product.refresh` worker.
 * Stage 3: @agent:atlas Add listingQueue worker for marketplace submission.
 *
 * Reference: Production Blueprint §3.1 — "single worker process and durable queue"
 */

import { Worker, type Job } from 'bullmq';
import { redis, refreshQueue, registerRepeatableSyncJobs } from '../lib/queue/index';
import { db, withTenant, setTenantContextOn } from '../lib/db/index';
import { getSupplierAdapter } from '../lib/adapters/factory';
import type { CanonicalProduct } from '../lib/types/canonical';
import { randomUUID } from 'node:crypto';
import { notify } from '../lib/alerts/index';
import { calculateMargin } from '../lib/margin/calculator';
import { isRepricingPaused, generateSuggestion } from '../lib/repricing/engine';
import type { PoolClient } from 'pg';
import { logger } from '../lib/logger';
import { markWebhookEventProcessed } from '../lib/adapters/ebay/webhook-handler';

logger.warn('worker', '[Worker] Starting GhostCart worker process...');

// Initialize automated sync repeatable cron job
void registerRepeatableSyncJobs();

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
  durationMs?: number | undefined;
}

/** Average per-field normalization confidence → 0..1 completeness score. */
function computeCompleteness(product: CanonicalProduct): number {
  if (!product.confidence || product.confidence.length === 0) return 0;
  const sum = product.confidence.reduce((acc, c) => acc + (c.score ?? 0), 0);
  return Math.round((sum / product.confidence.length) * 100) / 100;
}

/** Persist a normalized CanonicalProduct to PostgreSQL. */
async function persistImport(
  product: CanonicalProduct,
  ctx: PersistContext,
  client?: PoolClient,
): Promise<void> {
  const productId = randomUUID();
  const execute = async (c: PoolClient) => {
    // Core product record (canonical fields → migrated columns, incl. 0002 additions).
    // `user_corrections` is initialized empty so the correction workflow has a stable base.
    await c.query(
      `INSERT INTO products
         (id, tenant_id, title, description, supplier_price_cents, currency,
          availability, primary_image_url, identifiers, additional_image_urls,
          confidence, imported_at, last_refreshed_at, source_url, user_corrections,
          review_status, import_duration_ms, normalization_completeness)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12, $13, $14,
               '{}'::jsonb, 'pending_review', $15, $16)
       ON CONFLICT (source_url) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             supplier_price_cents = EXCLUDED.supplier_price_cents,
             currency = EXCLUDED.currency,
             availability = EXCLUDED.availability,
             primary_image_url = EXCLUDED.primary_image_url,
             identifiers = EXCLUDED.identifiers,
             additional_image_urls = EXCLUDED.additional_image_urls,
             confidence = EXCLUDED.confidence,
             last_refreshed_at = now(),
             import_duration_ms = EXCLUDED.import_duration_ms,
             normalization_completeness = EXCLUDED.normalization_completeness,
             review_status = 'pending_review'`,
      [
        productId,
        product.tenantId,
        product.title,
        product.description,
        product.supplierPriceCents,
        product.currency,
        product.availability,
        product.primaryImageUrl,
        JSON.stringify(product.identifiers),
        product.additionalImageUrls,
        JSON.stringify(product.confidence),
        product.importedAt,
        product.lastRefreshedAt,
        product.sourceUrl,
        ctx.durationMs ?? null,
        computeCompleteness(product),
      ],
    );

    // Traceability: link the persisted product to its suppliers row via
    // product_sources (raw_source_metadata preserved). The canonical supplierId
    // is the adapterId (text); resolve the UUID suppliers row by adapter_id.
    // Never fail the whole import for traceability.
    const supplierRes = await c.query(
      `SELECT id FROM suppliers WHERE tenant_id = $1 AND adapter_id = $2 LIMIT 1`,
      [product.tenantId, product.supplierId],
    );
    const supplierId = supplierRes.rows[0]?.id ?? null;

    // ON CONFLICT (source_url) updates the existing row and keeps its original
    // id; read back the true id so product_sources references the right product.
    const productRow = await c.query(
      `SELECT id FROM products WHERE source_url = $1 LIMIT 1`,
      [product.sourceUrl],
    );
    const persistedProductId = productRow.rows[0]?.id ?? productId;

    if (supplierId) {
      await c.query(
        `INSERT INTO product_sources
           (product_id, tenant_id, supplier_id, source_url, raw_source_metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, now())`,
        [
          persistedProductId,
          product.tenantId,
          supplierId,
          product.sourceUrl,
          JSON.stringify(product.rawSourceMetadata),
        ],
      );
    }

    // Jobs table: upsert by idempotency_key (dedup).
    await c.query(
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
    await c.query(
      `INSERT INTO audit_events
         (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1, NULL, 'product.imported', 'products', $2, $3, now())`,
      [
        product.tenantId,
        productId,
        JSON.stringify({ url: product.sourceUrl, supplierId: product.supplierId }),
      ],
    );
  };

  if (client) {
    await execute(client);
    return;
  }

  const conn = await db.connect();
  try {
    await conn.query('BEGIN');
    await setTenantContextOn(conn, product.tenantId);
    await execute(conn);
    await conn.query('COMMIT');
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    conn.release();
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

export const importProcessor = async (job: Job) => {
  const { url, supplierId, tenantId, idempotencyKey } = job.data;

  // 1. Resolve the supplier row (by UUID) and look up its adapter by adapterId.
  const supplierResult = await db.query<{ adapter_id: string }>(
    `SELECT adapter_id FROM suppliers WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
    [supplierId, tenantId],
  );
  const adapter = getSupplierAdapter(supplierResult.rows[0]?.adapter_id ?? '');
  if (!adapter) {
    throw new Error(`Unknown supplier adapter for supplierId ${supplierId}`);
  }

  // 2. Import & normalize to a CanonicalProduct (instrument duration).
  const startedAt = Date.now();
  const product = await adapter.importProduct(url, tenantId);
  const durationMs = Date.now() - startedAt;

  // 3. Persist — graceful degradation (Option C). If Postgres is unavailable
  //    or @agent:archivist's schema TODOs aren't complete yet, the import
  //    result is still returned so the job doesn't retry-loop.
  let persisted = true;
  try {
    await persistImport(product, { jobId: job.id, tenantId, idempotencyKey, durationMs });
  } catch (err) {
    persisted = false;
    const msg = `DB persistence failed for import ${job.id ?? '?'}: ${(err as Error).message}`;
    logger.error('worker', msg, err);
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
};

const importWorker = new Worker(
  'product.import',
  importProcessor,
  {
    connection: redis,
    concurrency: 5, // TODO: @agent:archivist tune based on DB pool size
  },
);

importWorker.on('completed', (job) => {
  console.warn(`[Worker] Import job ${job.id} completed`);
});

/** Move an exhausted job to the durable dead-letter queue (best-effort). */
async function dispatchToDeadLetter(
  job: Job,
  errorMessage: string,
): Promise<void> {
  const { tenantId, supplierId, url, idempotencyKey } = job.data ?? {};
  try {
    await db.query(
      `INSERT INTO dead_letter_queue
         (tenant_id, queue, bull_job_id, payload, error, attempts, created_at)
       VALUES ($1, 'product.import', $2, $3, $4, $5, now())`,
      [
        tenantId,
        job.id,
        JSON.stringify({ supplierId, url, idempotencyKey }),
        errorMessage,
        job.attemptsMade ?? 0,
      ],
    );
  } catch (err) {
    console.error('[Worker] Could not write dead-letter entry:', (err as Error).message);
  }
}

importWorker.on('failed', (job, err) => {
  console.error(`[Worker] Import job ${job?.id} failed:`, err.message);
  void recordJobFailure(job, err.message);
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
    void dispatchToDeadLetter(job, err.message).then(() =>
      console.warn(`[Worker] Import job ${job.id} moved to dead-letter queue`),
    );
    void notify({
      tenantId: job.data?.tenantId ?? null,
      alertType: 'job.failed_final',
      severity: 'critical',
      message: `Import job ${job.id} failed after ${job.attemptsMade} attempts; moved to DLQ`,
      payload: {
        queue: 'product.import',
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade,
      },
    });
  }
});

// ─── Product Refresh Worker ───────────────────────────────────────────────────
// Stage 2: refreshes an already-imported product from its supplier feed by
// re-running the adapter's fetchProduct and re-persisting (upsert).
// Stage 4: Extended to handle stock/price refresh with change detection,
// margin recalculations, repricing engine suggestions, alerts, and withTenant RLS.
export const refreshProcessor = async (job: Job) => {
  const { productId, tenantId, supplierId, idempotencyKey, refreshType = 'both' } = job.data;

  const adapter = getSupplierAdapter(supplierId);
  if (!adapter) {
    throw new Error(`Unknown supplier adapter: ${supplierId}`);
  }

  // 1. Fetch live product from supplier adapter first (outside transaction)
  const product = await adapter.fetchProduct(productId, tenantId);

  let persisted = true;
  let priceChanged = false;
  let stockChanged = false;

  try {
    await withTenant(tenantId, async (client) => {
      // 2. Query current product details using the transaction client
      const currentProduct = await client.query(
        `SELECT p.id, p.title, p.supplier_price_cents, p.current_stock,
                l.id as listing_id, l.price_cents as listing_price_cents, l.marketplace
         FROM products p
         LEFT JOIN listings l ON l.product_id = p.id
         WHERE p.id = $1`,
        [productId],
      );

      const oldPrice = (currentProduct.rowCount ?? 0) > 0 ? currentProduct.rows[0].supplier_price_cents : null;
      const oldStock = (currentProduct.rowCount ?? 0) > 0 ? currentProduct.rows[0].current_stock : null;
      const listingId = (currentProduct.rowCount ?? 0) > 0 ? currentProduct.rows[0].listing_id : null;
      const listingPriceCents = (currentProduct.rowCount ?? 0) > 0 ? currentProduct.rows[0].listing_price_cents : null;
      const listingMarketplace = (currentProduct.rowCount ?? 0) > 0 ? currentProduct.rows[0].marketplace : 'ebay';

      // 3. Persist the imported details using the client
      await persistImport(product, { jobId: job.id, tenantId, idempotencyKey }, client);

      // 4. Log price change if different
      if (refreshType === 'price' || refreshType === 'both') {
        const priceHistoryId = await client.query(
          'SELECT products.log_price_change($1, $2, $3, $4, $5) as history_id',
          [productId, oldPrice, product.supplierPriceCents, 'scheduled', null],
        );
        priceChanged = (priceHistoryId.rowCount ?? 0) > 0 && priceHistoryId.rows[0].history_id !== null;

        // If price changed and there is an active listing, recalculate margin and evaluate repricing
        if (priceChanged && listingId && listingPriceCents) {
          const marginResult = await calculateMargin({
            sellingPriceCents: listingPriceCents,
            costCents: product.supplierPriceCents,
            marketplace: listingMarketplace,
            tenantId,
          }, client);

          // Alert if margin falls below safe threshold (< 5% or negative)
          if (marginResult.marginPercent < 5) {
            await notify({
              tenantId,
              alertType: 'repricing.margin_risk',
              severity: marginResult.marginPercent < 0 ? 'critical' : 'warning',
              message: `Low profit margin warning: Product "${product.title}" margin is ${marginResult.marginPercent}% on ${listingMarketplace}.`,
              payload: {
                productId,
                listingId,
                marginPercent: marginResult.marginPercent,
                profitCents: marginResult.profitCents,
                supplierPriceCents: product.supplierPriceCents,
              },
            });
          }

          // Check if repricing is paused before generating suggestions
          const paused = await isRepricingPaused(tenantId, client);
          if (!paused) {
            await generateSuggestion({
              tenantId,
              listingId,
              currentPriceCents: listingPriceCents,
              costCents: product.supplierPriceCents,
            }, client);
          }
        }
      }

      // 5. Log stock change if different
      if (refreshType === 'stock' || refreshType === 'both') {
        const newStock = product.availability === 'in_stock' ? 100 : 0;
        const stockChangedResult = await client.query(
          'SELECT products.log_stock_change($1, $2, $3, $4, $5) as changed',
          [productId, oldStock, newStock, 'scheduled', null],
        );
        stockChanged = (stockChangedResult.rowCount ?? 0) > 0 && stockChangedResult.rows[0].changed;

        // Out-of-stock warning alert
        if (product.availability === 'out_of_stock' || newStock === 0) {
          await notify({
            tenantId,
            alertType: 'stock.out_of_stock',
            severity: 'warning',
            message: `Supplier out of stock: Product "${product.title}" is currently out of stock.`,
            payload: {
              productId,
              supplierId,
              oldStock,
            },
          });
        }
      }

      await client.query(
        `UPDATE products SET last_refreshed_at = now(), review_status = review_status
          WHERE id = $1`,
        [productId],
      );

      // Audit event for refresh
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, NULL, 'product.refreshed', 'products', $2, $3, now())`,
        [
          tenantId,
          productId,
          JSON.stringify({
            refreshType,
            priceChanged,
            stockChanged,
            oldPrice,
            newPrice: product.supplierPriceCents,
          }),
        ],
      );
    });
  } catch (err) {
    persisted = false;
    logger.error('worker', `Refresh persist failed for ${job.id}`, err);
    throw err; // Rethrow to trigger BullMQ retries and DLQ behavior
  }

  return { productId, persisted, priceChanged, stockChanged };
};

const refreshWorker = new Worker(
  'product.refresh',
  refreshProcessor,
  { connection: redis, concurrency: 5 },
);

refreshWorker.on('failed', (job, err) => {
  logger.error('worker', `Refresh job ${job?.id} failed: ${err.message}`);
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
    void (async () => {
      const { tenantId, supplierId, productId } = job.data ?? {};
      try {
        await db.query(
          `INSERT INTO dead_letter_queue
             (tenant_id, queue, bull_job_id, payload, error, attempts, created_at)
           VALUES ($1, 'product.refresh', $2, $3, $4, $5, now())`,
          [tenantId, job.id, JSON.stringify({ supplierId, productId }), err.message, job.attemptsMade],
        );
      } catch (e) {
        logger.error('worker', `Could not write DLQ for refresh: ${(e as Error).message}`);
      }
      await notify({
        tenantId: tenantId ?? null,
        alertType: 'job.failed_final',
        severity: 'critical',
        message: `Refresh job ${job.id} failed after ${job.attemptsMade} attempts; moved to DLQ`,
        payload: {
          queue: 'product.refresh',
          jobId: job.id,
          productId: productId ?? null,
          error: err.message,
          attempts: job.attemptsMade,
        },
      });
    })();
  }
});

// ─── Automated Sync Scheduler Worker ──────────────────────────────────────────
// Runs periodically to query products that are stale and enqueues them for refresh.
export const syncSchedulerProcessor = async (job: Job) => {
  logger.warn('worker', `Running scheduled stock/price sync pass (job ${job.id})...`);
  
  // Find products requiring sync (refreshed > 6 hours ago or never refreshed)
  const staleProducts = await db.query(
    `SELECT p.id, p.tenant_id, p.supplier_id
     FROM products p
     JOIN tenants t ON p.tenant_id = t.id
     WHERE t.suspended_at IS NULL 
       AND (p.last_refreshed_at IS NULL 
         OR p.last_refreshed_at < now() - INTERVAL '6 hours')
     ORDER BY p.last_refreshed_at ASC NULLS FIRST
     LIMIT 100`,
  );

  let enqueuedCount = 0;
  for (let i = 0; i < staleProducts.rows.length; i++) {
    const row = staleProducts.rows[i];
    await refreshQueue.add(
      'product.refresh',
      {
        productId: row.id,
        tenantId: row.tenant_id,
        supplierId: row.supplier_id,
        idempotencyKey: `sync-${row.id}-${Date.now()}`,
        refreshType: 'both',
      },
      {
        delay: i * 200, // 200ms delay between dispatches to prevent supplier spikes
      },
    );
    enqueuedCount++;
  }

  logger.warn('worker', `Scheduled sync pass completed. Enqueued ${enqueuedCount} refresh jobs.`);
  return { enqueuedCount };
};

const syncSchedulerWorker = new Worker(
  'product.sync_scheduler',
  syncSchedulerProcessor,
  { connection: redis, concurrency: 1 },
);

syncSchedulerWorker.on('failed', (job, err) => {
  logger.error('worker', `Sync scheduler job ${job?.id} failed: ${err.message}`);
});

// ─── eBay Webhook Async Processing Worker ─────────────────────────────────────
// Processes verified marketplace notifications asynchronously from BullMQ
export const ebayWebhookProcessor = async (job: Job) => {
  const { eventId, eventType, tenantId, payload } = job.data ?? {};
  logger.warn('worker', `[Worker] Processing eBay webhook event ${eventId} (${eventType}) for tenant ${tenantId}`);

  if (tenantId) {
    await withTenant(tenantId, async (client) => {
      // Handle listing update events
      if (eventType === 'ITEM_SOLD' || eventType === 'ITEM_UPDATED' || eventType === 'ITEM_CREATED') {
        const itemId = payload?.notification?.data?.itemId || payload?.data?.itemId || payload?.itemId;
        if (itemId) {
          const newState = eventType === 'ITEM_SOLD' ? 'sold' : 'published';
          await client.query(
            `UPDATE listings
             SET state = $1,
                 updated_at = now()
             WHERE tenant_id = $2 AND (marketplace_listing_id = $3 OR id::text = $3)`,
            [newState, tenantId, itemId],
          );
        }
      }

      // Record audit event
      await client.query(
        `INSERT INTO audit_events
           (tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES ($1, NULL, 'ebay.webhook_processed', 'webhook_events', NULL, $2, now())`,
        [tenantId, JSON.stringify({ eventId, eventType })],
      );
    });
  }

  // Mark event as processed in webhook_events table
  if (eventId) {
    await markWebhookEventProcessed(eventId);
  }

  return { processed: true, eventId, eventType };
};

const ebayWebhookWorker = new Worker(
  'ebay.webhook',
  ebayWebhookProcessor,
  { connection: redis, concurrency: 5 },
);

ebayWebhookWorker.on('failed', (job, err) => {
  logger.error('worker', `eBay webhook job ${job?.id} failed: ${err.message}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('worker', '[Worker] Shutting down...');
  await Promise.allSettled([
    importWorker.close(),
    refreshWorker.close(),
    syncSchedulerWorker.close(),
    ebayWebhookWorker.close(),
  ]);
  process.exit(0);
});

