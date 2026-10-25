/**
 * Scheduled Refresh Processor — GC-301
 *
 * Reads enabled schedule records from `scheduled_refreshes`, calculates due items,
 * enqueues `product.refresh` BullMQ jobs for specific products or tenant-wide products,
 * and updates `last_run_at` / `next_run_at` timestamps.
 */

import cronParser from 'cron-parser';
import type { PoolClient } from 'pg';
import { db } from '../lib/db/index.js';
import { importQueue } from '../lib/queue/index.js';
import { randomUUID } from 'node:crypto';

export interface ScheduledRefreshRow {
  id: string;
  tenant_id: string;
  product_id: string | null;
  refresh_type: 'stock' | 'price' | 'both';
  schedule: string;
  enabled: boolean;
  last_run_at: Date | null;
  next_run_at: Date | null;
}

export interface EnqueuedRefreshJob {
  scheduleId: string;
  productId: string;
  tenantId: string;
  supplierId: string;
  refreshType: 'stock' | 'price' | 'both';
  idempotencyKey: string;
}

/**
 * Calculates the next run date based on a cron expression.
 * Returns null if the cron expression cannot be parsed.
 */
export function calculateNextRunAt(scheduleCron: string, currentDate = new Date()): Date | null {
  try {
    const interval = cronParser.parseExpression(scheduleCron, { currentDate });
    return interval.next().toDate();
  } catch {
    return null;
  }
}

/**
 * Process all due scheduled refreshes in the system.
 *
 * @param queryClient Optional DB client or pool wrapper for querying.
 * @returns Array of enqueued job parameters for verification/auditing.
 */
export async function processScheduledRefreshes(
  queryClient: { query: typeof db.query } = db,
): Promise<EnqueuedRefreshJob[]> {
  const enqueuedJobs: EnqueuedRefreshJob[] = [];

  // Query enabled scheduled refreshes where next_run_at is NULL or <= now()
  const dueSchedulesRes = await queryClient.query<ScheduledRefreshRow>(
    `SELECT id, tenant_id, product_id, refresh_type, schedule, enabled, last_run_at, next_run_at
     FROM scheduled_refreshes
     WHERE enabled = true
       AND (next_run_at IS NULL OR next_run_at <= now())
     ORDER BY created_at ASC`,
  );

  const dueSchedules = dueSchedulesRes.rows;

  for (const scheduleRow of dueSchedules) {
    const now = new Date();
    const nextRun = calculateNextRunAt(scheduleRow.schedule, now) ?? new Date(now.getTime() + 3600 * 1000);

    let productsToRefresh: Array<{ id: string; supplier_id: string | null }> = [];

    if (scheduleRow.product_id) {
      // Single product refresh
      const pRes = await queryClient.query<{ id: string; supplier_id: string | null }>(
        `SELECT p.id, ps.supplier_id
         FROM products p
         LEFT JOIN product_sources ps ON ps.product_id = p.id
         WHERE p.id = $1 AND p.tenant_id = $2
         LIMIT 1`,
        [scheduleRow.product_id, scheduleRow.tenant_id],
      );
      if (pRes.rowCount && pRes.rowCount > 0) {
        productsToRefresh = pRes.rows;
      }
    } else {
      // Tenant-wide refresh: all products for the tenant
      const pRes = await queryClient.query<{ id: string; supplier_id: string | null }>(
        `SELECT p.id, ps.supplier_id
         FROM products p
         LEFT JOIN product_sources ps ON ps.product_id = p.id
         WHERE p.tenant_id = $1`,
        [scheduleRow.tenant_id],
      );
      productsToRefresh = pRes.rows;
    }

    for (const prod of productsToRefresh) {
      const supplierId = prod.supplier_id ?? 'csv'; // default supplier fallback if not explicitly linked
      const idempotencyKey = `refresh:${scheduleRow.id}:${prod.id}:${now.toISOString().slice(0, 13)}`;

      const jobPayload = {
        scheduleId: scheduleRow.id,
        productId: prod.id,
        tenantId: scheduleRow.tenant_id,
        supplierId,
        refreshType: scheduleRow.refresh_type,
        idempotencyKey,
      };

      try {
        if (importQueue) {
          await importQueue.add('product.refresh', jobPayload, {
            jobId: idempotencyKey,
          });
        }
        enqueuedJobs.push(jobPayload);
      } catch (err) {
        console.error(`[Scheduler] Failed to enqueue product.refresh job for product ${prod.id}:`, (err as Error).message);
      }
    }

    // Update scheduled_refreshes table with last_run_at and next_run_at
    try {
      await queryClient.query(
        `UPDATE scheduled_refreshes
         SET last_run_at = now(),
             next_run_at = $1,
             updated_at = now()
         WHERE id = $2`,
        [nextRun, scheduleRow.id],
      );
    } catch (err) {
      console.error(`[Scheduler] Failed to update next_run_at for schedule ${scheduleRow.id}:`, (err as Error).message);
    }
  }

  return enqueuedJobs;
}
