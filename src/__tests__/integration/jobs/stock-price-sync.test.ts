/**
 * Stock & Price Sync Integration Tests
 *
 * Validates deterministic margin calculations under tenant context,
 * repricing suggestion triggers, pause controls, and background workers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';

const { mockQuery, mockDb, mockNotify, mockFetchProduct, mockSupplierAdapter } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockDb = { query: mockQuery };
  const mockNotify = vi.fn();
  const mockFetchProduct = vi.fn();
  const mockSupplierAdapter = {
    fetchProduct: mockFetchProduct,
  };
  return { mockQuery, mockDb, mockNotify, mockFetchProduct, mockSupplierAdapter };
});

vi.mock('@/lib/db/index', () => ({
  db: mockDb,
  withTenant: vi.fn(async (_tenantId: string, work: (client: unknown) => Promise<unknown>) => work(mockDb)),
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  setTenantContextOn: vi.fn(async () => undefined),
}));

vi.mock('@/lib/queue/index', () => ({
  redis: {},
  refreshQueue: { add: vi.fn() },
  registerRepeatableSyncJobs: vi.fn(),
}));

vi.mock('@/lib/alerts/index', () => ({
  notify: mockNotify,
}));

vi.mock('@/lib/adapters/factory', () => ({
  getSupplierAdapter: vi.fn(() => mockSupplierAdapter),
}));

import { calculateMargin, calculateShippingCost } from '@/lib/margin/calculator';
import {
  isRepricingPaused,
  setRepricingPause,
  generateSuggestion,
  getRepricingRules,
} from '@/lib/repricing/engine';
import { refreshProcessor } from '@/worker/index';

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_LISTING_ID = '11111111-1111-1111-1111-111111111111';

describe('Stock & Price Sync Engine & Tenancy Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Margin Calculator Tenancy Isolation', () => {
    it('calculates shipping cost under tenant RLS context', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ shipping: 550 }],
        rowCount: 1,
      });

      const cost = await calculateShippingCost(TEST_TENANT_ID, 'usps', 500);
      expect(cost).toBe(550);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT margin.calculate_shipping_cost($1, $2, $3) as shipping',
        [TEST_TENANT_ID, 'usps', 500],
      );
    });

    it('calculates full margin breakdown accurately', async () => {
      // Mock calculateMarketplaceFees
      mockQuery.mockResolvedValueOnce({
        rows: [{ fees: 300 }],
        rowCount: 1,
      });
      // Mock calculateTax
      mockQuery.mockResolvedValueOnce({
        rows: [{ tax: 150 }],
        rowCount: 1,
      });
      // Mock calculateShippingCost
      mockQuery.mockResolvedValueOnce({
        rows: [{ shipping: 500 }],
        rowCount: 1,
      });

      const result = await calculateMargin({
        sellingPriceCents: 5000,
        costCents: 2500,
        marketplace: 'ebay',
        tenantId: TEST_TENANT_ID,
      });

      expect(result.profitCents).toBe(1550); // 5000 - (2500 + 300 + 150 + 500)
      expect(result.marginPercent).toBe(31);
      expect(result.breakdown.costCents).toBe(2500);
      expect(result.breakdown.feesCents).toBe(300);
      expect(result.breakdown.taxCents).toBe(150);
      expect(result.breakdown.shippingCents).toBe(500);
    });
  });

  describe('Repricing Engine Tenancy & Pause Controls', () => {
    it('checks if repricing is paused for tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ paused: true }],
        rowCount: 1,
      });

      const paused = await isRepricingPaused(TEST_TENANT_ID);
      expect(paused).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT repricing.is_paused($1) as paused',
        [TEST_TENANT_ID],
      );
    });

    it('sets repricing pause state with tenant context', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ success: true }],
        rowCount: 1,
      });

      const success = await setRepricingPause(TEST_TENANT_ID, true, 'Emergency sync pause', 'user-123');
      expect(success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT repricing.set_pause($1, $2, $3, $4) as success',
        [TEST_TENANT_ID, true, 'Emergency sync pause', 'user-123'],
      );
    });

    it('generates repricing suggestions within tenant context', async () => {
      // generateSuggestion rule lookup and bounds validation
      mockQuery.mockResolvedValueOnce({
        rows: [{
          floor_price_cents: 1000,
          ceiling_price_cents: 10000,
          margin_target_percent: 15,
          beat_by_cents: 0,
          beat_by_percent: 0,
          enabled: true,
        }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ suggestion_id: 'sugg-999' }],
        rowCount: 1,
      });

      const suggestionId = await generateSuggestion({
        tenantId: TEST_TENANT_ID,
        listingId: TEST_LISTING_ID,
        currentPriceCents: 4999,
        costCents: 2000,
        competitorPriceCents: 4500,
      });

      expect(suggestionId).toBe('sugg-999');
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT repricing.generate_suggestion($1, $2, $3, $4, $5) as suggestion_id',
        [TEST_TENANT_ID, TEST_LISTING_ID, 4999, 2000, 4500],
      );
    });

    it('retrieves repricing rules for tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rule-1',
            tenant_id: TEST_TENANT_ID,
            rule_name: 'Beat Lowest by 1%',
            floor_price_cents: 1500,
            ceiling_price_cents: 10000,
            margin_target_percent: '15.00',
            beat_by_cents: 0,
            beat_by_percent: '1.00',
            enabled: true,
          },
        ],
        rowCount: 1,
      });

      const rules = await getRepricingRules(TEST_TENANT_ID);
      expect(rules).toHaveLength(1);
      expect(rules[0].ruleName).toBe('Beat Lowest by 1%');
      expect(rules[0].floorPriceCents).toBe(1500);
      expect(rules[0].marginTargetPercent).toBe(15);
    });
  });

  describe('Worker Processors Integration', () => {
    const mockJob = {
      id: 'job-123',
      data: {
        productId: 'prod-abc',
        tenantId: TEST_TENANT_ID,
        supplierId: 'ebay',
        idempotencyKey: 'key-123',
        refreshType: 'both',
      },
    } as unknown as Job;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('performs price delta detection, updates history, and evaluates repricing', async () => {
      // 1. Mock fetchProduct from adapter: supplierPriceCents = 2500 (price changed)
      mockFetchProduct.mockResolvedValueOnce({
        id: 'prod-abc',
        tenantId: TEST_TENANT_ID,
        supplierId: 'ebay',
        title: 'Test Item',
        supplierPriceCents: 2500,
        availability: 'in_stock',
        sourceUrl: 'https://example.com/source',
      });

      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT p.id, p.title, p.supplier_price_cents')) {
          return {
            rows: [{
              id: 'prod-abc',
              title: 'Test Item',
              supplier_price_cents: 2000,
              current_stock: 10,
              listing_id: TEST_LISTING_ID,
              listing_price_cents: 4999,
              marketplace: 'ebay'
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('SELECT id FROM suppliers')) {
          return { rows: [{ id: 'supp-uuid' }], rowCount: 1 };
        }
        if (sql.includes('SELECT id FROM products WHERE source_url')) {
          return { rows: [{ id: 'prod-abc' }], rowCount: 1 };
        }
        if (sql.includes('log_price_change')) {
          return { rows: [{ history_id: 'price-hist-uuid' }], rowCount: 1 };
        }
        if (sql.includes('calculate_marketplace_fees')) {
          return { rows: [{ fees: 500 }], rowCount: 1 };
        }
        if (sql.includes('calculate_tax')) {
          return { rows: [{ tax: 300 }], rowCount: 1 };
        }
        if (sql.includes('calculate_shipping_cost')) {
          return { rows: [{ shipping: 600 }], rowCount: 1 };
        }
        if (sql.includes('is_paused')) {
          return { rows: [{ paused: false }], rowCount: 1 };
        }
        if (sql.includes('FROM repricing.repricing_rules') || sql.includes('FROM repricing_rules')) {
          return {
            rows: [{
              floor_price_cents: 1000,
              ceiling_price_cents: 10000,
              margin_target_percent: 15,
              beat_by_cents: 0,
              beat_by_percent: 0,
              enabled: true,
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('generate_suggestion')) {
          return { rows: [{ suggestion_id: 'sugg-uuid-123' }], rowCount: 1 };
        }
        if (sql.includes('log_stock_change')) {
          return { rows: [{ changed: true }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await refreshProcessor(mockJob);

      expect(result.persisted).toBe(true);
      expect(result.priceChanged).toBe(true);
      expect(mockFetchProduct).toHaveBeenCalledWith('prod-abc', TEST_TENANT_ID);
      // Assert suggestion was triggered
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('repricing.generate_suggestion'),
        [TEST_TENANT_ID, TEST_LISTING_ID, 4999, 2500, null]
      );
    });

    it('performs stock delta detection, logs change, and triggers out-of-stock alert', async () => {
      // 1. Mock fetchProduct from adapter: out of stock
      mockFetchProduct.mockResolvedValueOnce({
        id: 'prod-abc',
        tenantId: TEST_TENANT_ID,
        supplierId: 'ebay',
        title: 'Test Item',
        supplierPriceCents: 2000,
        availability: 'out_of_stock',
        sourceUrl: 'https://example.com/source',
      });

      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT p.id, p.title, p.supplier_price_cents')) {
          return {
            rows: [{
              id: 'prod-abc',
              title: 'Test Item',
              supplier_price_cents: 2000,
              current_stock: 10,
              listing_id: null,
              listing_price_cents: null,
              marketplace: 'ebay'
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('SELECT id FROM suppliers')) {
          return { rows: [{ id: 'supp-uuid' }], rowCount: 1 };
        }
        if (sql.includes('SELECT id FROM products WHERE source_url')) {
          return { rows: [{ id: 'prod-abc' }], rowCount: 1 };
        }
        if (sql.includes('log_stock_change')) {
          return { rows: [{ changed: true }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      });

      const result = await refreshProcessor(mockJob);

      expect(result.stockChanged).toBe(true);
      // Assert stock alert notification was dispatched
      expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({
        alertType: 'stock.out_of_stock',
        severity: 'warning',
        tenantId: TEST_TENANT_ID,
      }));
    });

    it('respects repricing pause states and suppresses suggestions when paused', async () => {
      // 1. Mock fetchProduct: supplierPriceCents = 2500 (price changed)
      mockFetchProduct.mockResolvedValueOnce({
        id: 'prod-abc',
        tenantId: TEST_TENANT_ID,
        supplierId: 'ebay',
        title: 'Test Item',
        supplierPriceCents: 2500,
        availability: 'in_stock',
        sourceUrl: 'https://example.com/source',
      });

      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT p.id, p.title, p.supplier_price_cents')) {
          return {
            rows: [{
              id: 'prod-abc',
              title: 'Test Item',
              supplier_price_cents: 2000,
              current_stock: 10,
              listing_id: TEST_LISTING_ID,
              listing_price_cents: 4999,
              marketplace: 'ebay'
            }],
            rowCount: 1,
          };
        }
        if (sql.includes('SELECT id FROM suppliers')) {
          return { rows: [{ id: 'supp-uuid' }], rowCount: 1 };
        }
        if (sql.includes('SELECT id FROM products WHERE source_url')) {
          return { rows: [{ id: 'prod-abc' }], rowCount: 1 };
        }
        if (sql.includes('log_price_change')) {
          return { rows: [{ history_id: 'price-hist-uuid' }], rowCount: 1 };
        }
        if (sql.includes('calculate_marketplace_fees')) {
          return { rows: [{ fees: 500 }], rowCount: 1 };
        }
        if (sql.includes('calculate_tax')) {
          return { rows: [{ tax: 300 }], rowCount: 1 };
        }
        if (sql.includes('calculate_shipping_cost')) {
          return { rows: [{ shipping: 600 }], rowCount: 1 };
        }
        if (sql.includes('is_paused')) {
          return { rows: [{ paused: true }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      });

      await refreshProcessor(mockJob);

      // Verify that repricing.generate_suggestion was NOT called
      const generateCalls = mockQuery.mock.calls.filter(c =>
        typeof c[0] === 'string' && c[0].includes('repricing.generate_suggestion')
      );
      expect(generateCalls).toHaveLength(0);
    });

    it('rethrows database errors to trigger BullMQ retries instead of swallowing them', async () => {
      // Mock lookup query to fail
      mockQuery.mockRejectedValueOnce(new Error('Postgres connection failure'));

      // Mock fetchProduct
      mockFetchProduct.mockResolvedValueOnce({
        id: 'prod-abc',
        tenantId: TEST_TENANT_ID,
        supplierId: 'ebay',
        title: 'Test Item',
        supplierPriceCents: 2000,
        availability: 'in_stock',
      });

      await expect(refreshProcessor(mockJob)).rejects.toThrow('Postgres connection failure');
    });
  });
});

