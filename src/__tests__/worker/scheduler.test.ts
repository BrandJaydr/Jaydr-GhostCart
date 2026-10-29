/**
 * Unit tests for GC-301 Scheduled Refresh Scheduler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateNextRunAt, processScheduledRefreshes } from '../../worker/scheduler.js';
import { refreshQueue, importQueue } from '../../lib/queue/index.js';

vi.mock('../../lib/queue/index.js', () => ({
  refreshQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  },
  importQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  },
}));

describe('GC-301 Scheduled Refresh Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateNextRunAt', () => {
    it('calculates the next run date for a valid cron expression', () => {
      const baseDate = new Date('2026-10-24T10:00:00Z');
      const nextRun = calculateNextRunAt('0 * * * *', baseDate);
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun?.toISOString()).toBe('2026-10-24T11:00:00.000Z');
    });

    it('returns null for an invalid cron expression', () => {
      const nextRun = calculateNextRunAt('invalid-cron');
      expect(nextRun).toBeNull();
    });
  });

  describe('processScheduledRefreshes', () => {
    it('enqueues jobs for single product schedules and updates schedule timestamps', async () => {
      const mockQuery = vi.fn();

      // 1. SELECT from scheduled_refreshes
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'sched-1',
            tenant_id: 'tenant-123',
            product_id: 'prod-456',
            refresh_type: 'both',
            schedule: '0 * * * *',
            enabled: true,
            last_run_at: null,
            next_run_at: null,
          },
        ],
        rowCount: 1,
      });

      // 2. SELECT product & supplier details
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'prod-456', supplier_id: 'aliexpress' }],
        rowCount: 1,
      });

      // 3. UPDATE scheduled_refreshes
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const queryClient = { query: mockQuery };
      const enqueuedJobs = await processScheduledRefreshes(queryClient);

      expect(enqueuedJobs).toHaveLength(1);
      expect(enqueuedJobs[0]).toMatchObject({
        scheduleId: 'sched-1',
        productId: 'prod-456',
        tenantId: 'tenant-123',
        supplierId: 'aliexpress',
        refreshType: 'both',
      });

      // Queue identity assertions (ERR-047 requirement)
      expect(refreshQueue.add).toHaveBeenCalledTimes(1);
      expect(refreshQueue.add).toHaveBeenCalledWith(
        'product.refresh',
        expect.objectContaining({
          scheduleId: 'sched-1',
          productId: 'prod-456',
          tenantId: 'tenant-123',
          supplierId: 'aliexpress',
          refreshType: 'both',
        }),
        expect.objectContaining({
          jobId: expect.stringMatching(/^refresh:sched-1:prod-456:/),
        }),
      );
      expect(importQueue.add).not.toHaveBeenCalled();

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery.mock.calls[2][0]).toContain('UPDATE scheduled_refreshes');
    });

    it('enqueues jobs for tenant-wide schedules (product_id IS NULL)', async () => {
      const mockQuery = vi.fn();

      // 1. SELECT from scheduled_refreshes
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'sched-2',
            tenant_id: 'tenant-123',
            product_id: null,
            refresh_type: 'price',
            schedule: '0 0 * * *',
            enabled: true,
            last_run_at: null,
            next_run_at: null,
          },
        ],
        rowCount: 1,
      });

      // 2. SELECT all products for tenant
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'prod-1', supplier_id: 'aliexpress' },
          { id: 'prod-2', supplier_id: 'csv' },
        ],
        rowCount: 2,
      });

      // 3. UPDATE scheduled_refreshes
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const queryClient = { query: mockQuery };
      const enqueuedJobs = await processScheduledRefreshes(queryClient);

      expect(enqueuedJobs).toHaveLength(2);
      expect(enqueuedJobs[0].productId).toBe('prod-1');
      expect(enqueuedJobs[1].productId).toBe('prod-2');

      // Queue identity assertions (ERR-047 requirement)
      expect(refreshQueue.add).toHaveBeenCalledTimes(2);
      expect(importQueue.add).not.toHaveBeenCalled();
    });
  });
});
