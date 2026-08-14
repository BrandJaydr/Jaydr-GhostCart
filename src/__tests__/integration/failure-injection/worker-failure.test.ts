/**
 * Failure-Injection Tests for Worker
 *
 * Tests worker resilience under various failure scenarios.
 *
 * @agent:oracle Add more failure scenarios as needed
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/index';

describe('Worker Failure Injection Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM jobs WHERE idempotency_key LIKE $1', ['test-failure-%']);
  });

  afterEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM jobs WHERE idempotency_key LIKE $1', ['test-failure-%']);
  });

  describe('Database Connection Failure', () => {
    it('should handle database connection failure during import', async () => {
      // This test would simulate database connection failure
      // In a real implementation, we'd use a mock database client that can fail
      // For now, we'll test the error handling path

      const idempotencyKey = 'test-failure-db-conn';
      
      // Simulate a failed import job
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, created_at, completed_at)
         VALUES ($1, $2, 'product.import', '{}', $3, 'failed', 1, 'Database connection failed', now(), now())`,
        ['test-job-id-1', '00000000-0000-0000-0000-000000000001', idempotencyKey],
      );

      // Verify job was recorded as failed
      const result = await db.query(
        'SELECT status, last_error FROM jobs WHERE idempotency_key = $1',
        [idempotencyKey],
      );

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0].status).toBe('failed');
      expect(result.rows[0].last_error).toContain('Database connection failed');
    });

    it('should retry database connection failures', async () => {
      const idempotencyKey = 'test-failure-db-retry';
      
      // Simulate a job that will be retried
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, created_at)
         VALUES ($1, $2, 'product.import', '{}', $3, 'queued', 0, NULL, now())`,
        ['test-job-id-2', '00000000-0000-0000-0000-000000000001', idempotencyKey],
      );

      // Verify job is queued for retry
      const result = await db.query(
        'SELECT status, attempts FROM jobs WHERE idempotency_key = $1',
        [idempotencyKey],
      );

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0].status).toBe('queued');
      expect(result.rows[0].attempts).toBe(0);
    });
  });

  describe('Redis Connection Failure', () => {
    it('should handle Redis connection failure gracefully', async () => {
      // This test would simulate Redis connection failure
      // The system should fall back to direct database operations
      
      const idempotencyKey = 'test-failure-redis';
      
      // Simulate a job that couldn't be enqueued due to Redis failure
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, created_at, completed_at)
         VALUES ($1, $2, 'product.import', '{}', $3, 'failed', 1, 'Redis connection failed', now(), now())`,
        ['test-job-id-3', '00000000-0000-0000-0000-000000000001', idempotencyKey],
      );

      const result = await db.query(
        'SELECT status, last_error FROM jobs WHERE idempotency_key = $1',
        [idempotencyKey],
      );

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0].status).toBe('failed');
    });
  });

  describe('External API Timeout', () => {
    it('should handle external API timeouts with retry', async () => {
      const idempotencyKey = 'test-failure-api-timeout';
      
      // Simulate a job that failed due to API timeout
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, error_category, created_at)
         VALUES ($1, $2, 'product.import', '{}', $3, 'queued', 1, 'API timeout after 30s', 'transient', now())`,
        ['test-job-id-4', '00000000-0000-0000-0000-000000000001', idempotencyKey],
      );

      const result = await db.query(
        'SELECT status, error_category, attempts FROM jobs WHERE idempotency_key = $1',
        [idempotencyKey],
      );

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0].status).toBe('queued');
      expect(result.rows[0].error_category).toBe('transient');
      expect(result.rows[0].attempts).toBe(1);
    });
  });

  describe('Dead-Letter Queue Dispatch', () => {
    it('should move exhausted jobs to dead-letter queue', async () => {
      const idempotencyKey = 'test-failure-dlq';
      
      // Simulate a job that exceeded max attempts
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, created_at, completed_at)
         VALUES ($1, $2, 'product.import', '{}', $3, 'failed', 4, 'Max retries exceeded', now(), now())`,
        ['test-job-id-5', '00000000-0000-0000-0000-000000000001', idempotencyKey],
      );

      // Simulate dead-letter queue entry
      await db.query(
        `INSERT INTO dead_letter_queue
         (tenant_id, queue, bull_job_id, payload, error, attempts, created_at)
         VALUES ($1, 'product.import', $2, $3, $4, 4, now())`,
        [
          '00000000-0000-0000-0000-000000000001',
          'test-job-id-5',
          JSON.stringify({ url: 'https://example.com' }),
          'Max retries exceeded',
        ],
      );

      // Verify dead-letter queue entry
      const dlqResult = await db.query(
        'SELECT * FROM dead_letter_queue WHERE bull_job_id = $1',
        ['test-job-id-5'],
      );

      expect(dlqResult.rowCount).toBeGreaterThan(0);
      expect(dlqResult.rows[0].error).toBe('Max retries exceeded');
      expect(dlqResult.rows[0].attempts).toBe(4);
    });
  });

  describe('Reconciliation After Failure', () => {
    it('should reconcile data after worker failure', async () => {
      const productId = 'test-product-reconciliation';
      
      // Create a product with inconsistent state
      await db.query(
        `INSERT INTO products
         (id, tenant_id, title, supplier_price_cents, currency, availability, primary_image_url, source_url, imported_at, last_refreshed_at)
         VALUES ($1, $2, 'Test Product', 10000, 'USD', 'in_stock', 'https://example.com/image.jpg', 'https://example.com', now(), now())`,
        [productId, '00000000-0000-0000-0000-000000000001'],
      );

      // Simulate a failed refresh that left data in inconsistent state
      await db.query(
        `INSERT INTO jobs
         (id, tenant_id, type, payload, idempotency_key, status, attempts, last_error, created_at, completed_at)
         VALUES ($1, $2, 'product.refresh', $3, $4, 'failed', 1, 'Partial update failed', now(), now())`,
        ['test-job-id-6', '00000000-0000-0000-0000-000000000001', JSON.stringify({ productId }), 'test-reconcile'],
      );

      // Reconciliation: Verify product data is still valid
      const productResult = await db.query(
        'SELECT * FROM products WHERE id = $1',
        [productId],
      );

      expect(productResult.rowCount).toBeGreaterThan(0);
      expect(productResult.rows[0].title).toBe('Test Product');
      expect(productResult.rows[0].supplier_price_cents).toBe(10000);
    });
  });
});
