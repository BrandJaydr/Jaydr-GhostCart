/**
 * Stock & Price Sync Integration Tests
 *
 * Validates deterministic margin calculations under tenant context,
 * repricing suggestion triggers, and pause controls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery, mockDb } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockDb = { query: mockQuery };
  return { mockQuery, mockDb };
});

vi.mock('@/lib/db/index', () => ({
  db: mockDb,
  withTenant: vi.fn(async (_tenantId: string, work: (client: any) => Promise<any>) => work(mockDb)),
  DEV_TENANT_ID: '00000000-0000-0000-0000-000000000001',
  setTenantContextOn: vi.fn(async () => undefined),
}));

import { calculateMargin, calculateShippingCost } from '@/lib/margin/calculator';
import {
  isRepricingPaused,
  setRepricingPause,
  generateSuggestion,
  getRepricingRules,
} from '@/lib/repricing/engine';

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
});
