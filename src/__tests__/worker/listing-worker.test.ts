/**
 * Unit & Integration tests for GC-302 Listing Submission Worker Processor & DLQ
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processListingSubmitJob, handleListingSubmitFailure } from '../../worker/index.js';
import { db, withTenant } from '../../lib/db/index.js';
import { getEBayClient } from '../../lib/adapters/ebay/ebay-client.js';
import { notify } from '../../lib/alerts/index.js';
import type { Job } from 'bullmq';

vi.mock('../../lib/db/index.js', () => {
  const mockQuery = vi.fn();
  const mockWithTenant = vi.fn((tenantId: string, fn: (client: any) => Promise<any>) =>
    fn({ query: mockQuery }),
  );
  return {
    db: { query: mockQuery },
    withTenant: mockWithTenant,
    setTenantContextOn: vi.fn(),
  };
});

vi.mock('../../lib/adapters/ebay/ebay-client.js', () => ({
  getEBayClient: vi.fn(),
}));

vi.mock('../../lib/alerts/index.js', () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/queue/index.js', () => ({
  redis: {},
  importQueue: {},
  refreshQueue: {},
  listingQueue: {},
}));

describe('GC-302 Listing Submission Worker Processor & Queue Contract', () => {
  const mockAddListing = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEBayClient).mockReturnValue({
      addListing: mockAddListing,
    } as any);
  });

  describe('processListingSubmitJob (Queue Consumer)', () => {
    it('processes enqueued route payload end-to-end (DB lookup -> eBay submit -> audit log)', async () => {
      // Job payload shape created by POST /api/ebay/submit route
      const enqueuedJobPayload = {
        listingId: '11111111-1111-1111-1111-111111111111',
        tenantId: '00000000-0000-0000-0000-000000000001',
        idempotencyKey: 'submit_11111111-1111-1111-1111-111111111111',
        marketplace: 'ebay',
        category: '1234',
        condition: 'New',
        listingType: 'FixedPriceItem',
        duration: 'GTC',
      };

      const mockJob = {
        id: 'job-submit-999',
        data: enqueuedJobPayload,
      } as unknown as Job;

      // Mock database SELECT for listing draft
      vi.mocked(db.query).mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: enqueuedJobPayload.listingId,
            title: 'Test Ergonomic Mechanical Keyboard',
            description: 'A great mechanical keyboard with custom switches',
            list_price_cents: 12999,
            currency: 'USD',
            image_urls: ['https://example.com/keyboard.jpg'],
          },
        ],
      } as any);

      // Mock eBay client response
      mockAddListing.mockResolvedValueOnce({
        itemId: 'ebay-item-999',
        viewItemURL: 'https://ebay.com/itm/999',
      });

      const result = await processListingSubmitJob(mockJob);

      expect(result).toEqual({
        listingId: enqueuedJobPayload.listingId,
        ebayItemId: 'ebay-item-999',
        state: 'submitted',
      });

      // Verify draft lookup with tenant isolation
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, title, description'),
        [enqueuedJobPayload.listingId, enqueuedJobPayload.tenantId],
      );

      // Verify mapped eBay listing submission
      expect(mockAddListing).toHaveBeenCalledTimes(1);
      expect(mockAddListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Ergonomic Mechanical Keyboard',
          description: 'A great mechanical keyboard with custom switches',
          price: 129.99,
          currency: 'USD',
          category: '1234',
          condition: 'New',
          listingType: 'FixedPriceItem',
          duration: 'GTC',
        }),
      );

      // Verify update in withTenant block
      expect(withTenant).toHaveBeenCalledWith(enqueuedJobPayload.tenantId, expect.any(Function));
    });

    it('throws error if marketplace is unsupported', async () => {
      const mockJob = {
        id: 'job-456',
        data: {
          listingId: '11111111-1111-1111-1111-111111111111',
          tenantId: '00000000-0000-0000-0000-000000000001',
          marketplace: 'amazon',
        },
      } as unknown as Job;

      await expect(processListingSubmitJob(mockJob)).rejects.toThrow(
        'Unsupported marketplace: amazon',
      );
    });

    it('throws error if listing is not found in database', async () => {
      const mockJob = {
        id: 'job-789',
        data: {
          listingId: 'non-existent-listing',
          tenantId: '00000000-0000-0000-0000-000000000001',
          marketplace: 'ebay',
        },
      } as unknown as Job;

      vi.mocked(db.query).mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      } as any);

      await expect(processListingSubmitJob(mockJob)).rejects.toThrow(
        'Listing not found: non-existent-listing',
      );
    });

    it('throws error if eBay listing validation fails', async () => {
      const mockJob = {
        id: 'job-000',
        data: {
          listingId: '11111111-1111-1111-1111-111111111111',
          tenantId: '00000000-0000-0000-0000-000000000001',
          marketplace: 'ebay',
        },
      } as unknown as Job;

      // Mock listing with missing title or invalid price
      vi.mocked(db.query).mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            title: '', // empty title fails validation
            description: 'Short desc',
            list_price_cents: -100, // negative price fails validation
            currency: 'USD',
            image_urls: [],
          },
        ],
      } as any);

      await expect(processListingSubmitJob(mockJob)).rejects.toThrow(
        /Listing validation failed/,
      );
    });
  });

  describe('handleListingSubmitFailure (DLQ & Retry Policy)', () => {
    it('records job failure for non-final attempts without dispatching to DLQ', async () => {
      const mockJob = {
        id: 'job-failed-attempt-1',
        attemptsMade: 1,
        opts: { attempts: 3 },
        data: {
          listingId: 'list-111',
          tenantId: 'tenant-222',
          idempotencyKey: 'idemp-555',
          marketplace: 'ebay',
        },
      } as unknown as Job;

      const error = new Error('Transient eBay rate limit');

      await handleListingSubmitFailure(mockJob, error);

      // Verify jobs table update (failed status recorded)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jobs'),
        expect.arrayContaining(['tenant-222', 'idemp-555', 1, 'Transient eBay rate limit']),
      );

      // Verify dead-letter queue was NOT written to on non-final attempt
      expect(db.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dead_letter_queue'),
        expect.anything(),
      );

      // Verify notification NOT sent on non-final attempt
      expect(notify).not.toHaveBeenCalled();
    });

    it('dispatches to DLQ, updates listing state, and notifies when max attempts run out', async () => {
      const mockJob = {
        id: 'job-failed-final',
        attemptsMade: 3,
        opts: { attempts: 3 },
        data: {
          listingId: 'list-111',
          tenantId: 'tenant-222',
          idempotencyKey: 'idemp-555',
          marketplace: 'ebay',
        },
      } as unknown as Job;

      const error = new Error('eBay API authorization expired');

      await handleListingSubmitFailure(mockJob, error);

      // Verify jobs table update (failed status)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jobs'),
        expect.arrayContaining(['tenant-222', 'idemp-555', 3, 'eBay API authorization expired']),
      );

      // Verify listings state update to 'failed'
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE listings SET state = 'failed'"),
        ['eBay API authorization expired', 'list-111', 'tenant-222'],
      );

      // Verify dead_letter_queue insertion
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dead_letter_queue'),
        expect.arrayContaining(['tenant-222', 'job-failed-final', 'eBay API authorization expired', 3]),
      );

      // Verify critical notification sent
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          alertType: 'job.failed_final',
          severity: 'critical',
          message: expect.stringContaining('Listing submit job job-failed-final failed after 3 attempts; moved to DLQ'),
        }),
      );
    });
  });
});
