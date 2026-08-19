/**
 * Job Management Tests
 *
 * Tests retry policy, kill switch, and error categorization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/index';

describe('Job Management', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM jobs WHERE tenant_id = $1', ['00000000-0000-0000-0000-000000000001']);
  });

  describe('error categorization', () => {
    it('should categorize transient errors', async () => {
      const result = await db.query(
        'SELECT categorize_error($1) as category',
        ['Connection timeout after 30s'],
      );

      expect(result.rows[0].category).toBe('transient');
    });

    it('should categorize rate limit errors as transient', async () => {
      const result = await db.query(
        'SELECT categorize_error($1) as category',
        ['Rate limit exceeded (429)'],
      );

      expect(result.rows[0].category).toBe('transient');
    });

    it('should categorize permanent errors', async () => {
      const result = await db.query(
        'SELECT categorize_error($1) as category',
        ['Invalid authentication credentials'],
      );

      expect(result.rows[0].category).toBe('permanent');
    });

    it('should categorize validation errors as permanent', async () => {
      const result = await db.query(
        'SELECT categorize_error($1) as category',
        ['Validation failed: title is required'],
      );

      expect(result.rows[0].category).toBe('permanent');
    });

    it('should categorize unknown errors', async () => {
      const result = await db.query(
        'SELECT categorize_error($1) as category',
        ['Unknown error occurred'],
      );

      expect(result.rows[0].category).toBe('unknown');
    });
  });

  describe('retry scheduling', () => {
    it('should schedule next retry with exponential backoff', async () => {
      // Create a test job
      const jobResult = await db.query(
        `INSERT INTO jobs (tenant_id, type, payload, idempotency_key, status, attempts)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        ['00000000-0000-0000-0000-000000000001', 'test', '{}', 'test-key', 'failed', 1],
      );

      const jobId = jobResult.rows[0].id;

      // Schedule retry
      const retryResult = await db.query(
        'SELECT schedule_retry($1) as next_retry',
        [jobId],
      );

      const nextRetry = retryResult.rows[0].next_retry;
      expect(nextRetry).not.toBeNull();

      // Verify job was updated
      const updatedJob = await db.query(
        'SELECT attempts, status, next_retry_at FROM jobs WHERE id = $1',
        [jobId],
      );

      expect(updatedJob.rows[0].attempts).toBe(2);
      expect(updatedJob.rows[0].status).toBe('pending');
      expect(updatedJob.rows[0].next_retry_at).not.toBeNull();
    });

    it('should throw error when max attempts exceeded', async () => {
      const jobResult = await db.query(
        `INSERT INTO jobs (tenant_id, type, payload, idempotency_key, status, attempts, max_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        ['00000000-0000-0000-0000-000000000001', 'test', '{}', 'test-key', 'failed', 5, 5],
      );

      const jobId = jobResult.rows[0].id;

      await expect(
        db.query('SELECT schedule_retry($1) as next_retry', [jobId]),
      ).rejects.toThrow('Max retry attempts exceeded');
    });

    it('should throw error when job is killed', async () => {
      const jobResult = await db.query(
        `INSERT INTO jobs (tenant_id, type, payload, idempotency_key, status, attempts, killed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        ['00000000-0000-0000-0000-000000000001', 'test', '{}', 'test-key', 'failed', 1, true],
      );

      const jobId = jobResult.rows[0].id;

      await expect(
        db.query('SELECT schedule_retry($1) as next_retry', [jobId]),
      ).rejects.toThrow('Job has been killed');
    });
  });

  describe('kill switch', () => {
    it('should kill a single job', async () => {
      const jobResult = await db.query(
        `INSERT INTO jobs (tenant_id, type, payload, idempotency_key, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['00000000-0000-0000-0000-000000000001', 'test', '{}', 'test-key', 'pending'],
      );

      const jobId = jobResult.rows[0].id;

      const result = await db.query(
        'SELECT kill_job($1, NULL) as killed',
        [jobId],
      );

      expect(result.rows[0].killed).toBe(true);

      // Verify job was killed
      const updatedJob = await db.query(
        'SELECT killed, status, next_retry_at FROM jobs WHERE id = $1',
        [jobId],
      );

      expect(updatedJob.rows[0].killed).toBe(true);
      expect(updatedJob.rows[0].status).toBe('cancelled');
      expect(updatedJob.rows[0].next_retry_at).toBeNull();
    });

    it('should kill all queued jobs for tenant', async () => {
      // Create multiple jobs
      await db.query(
        `INSERT INTO jobs (tenant_id, type, payload, idempotency_key, status)
         VALUES 
           ($1, $2, $3, $4, $5),
           ($1, $6, $7, $8, $9),
           ($1, $10, $11, $12, $13)`,
        [
          '00000000-0000-0000-0000-000000000001',
          'test1',
          '{}',
          'key1',
          'pending',
          'test2',
          '{}',
          'key2',
          'queued',
          'test3',
          '{}',
          'key3',
          'pending',
        ],
      );

      const result = await db.query(
        'SELECT kill_all_tenant_jobs($1, NULL) as killed',
        ['00000000-0000-0000-0000-000000000001'],
      );

      expect(parseInt(result.rows[0].killed as string, 10)).toBe(3);

      // Verify all jobs were killed
      const jobs = await db.query(
        'SELECT killed, status FROM jobs WHERE tenant_id = $1',
        ['00000000-0000-0000-0000-000000000001'],
      );

      jobs.rows.forEach((job) => {
        expect(job.killed).toBe(true);
        expect(job.status).toBe('cancelled');
      });
    });
  });
});
