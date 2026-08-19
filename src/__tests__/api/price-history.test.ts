/**
 * Price History Tracking & Analytics Tests
 *
 * Tests the price fluctuation analytics engine (volatility, patterns, trends)
 * and the secured GET /api/products/[id]/price-history route.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzePriceFluctuations,
  type PriceHistoryPoint,
} from '@/lib/products/price-history';
import { NextRequest } from 'next/server';

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_PRODUCT_ID = '11111111-1111-1111-1111-111111111111';

// Mocks
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

vi.mock('@/lib/middleware/resolve-actor', () => ({
  resolveActor: vi.fn(async () => ({
    userId: '00000000-0000-0000-0000-000000000001',
    tenantId: TEST_TENANT_ID,
    role: 'owner',
  })),
}));

import { GET } from '@/app/api/products/[id]/price-history/route';

describe('Price History Tracking & Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Analytics Engine (analyzePriceFluctuations)', () => {
    it('handles empty price history cleanly with baseline defaults', () => {
      const result = analyzePriceFluctuations([], 2500);
      expect(result.currentPriceCents).toBe(2500);
      expect(result.trend).toBe('stable');
      expect(result.volatilityScore).toBe(0);
      expect(result.detectedPatterns).toContain('Insufficient price history (0 data points)');
    });

    it('handles single initial price entry', () => {
      const history: PriceHistoryPoint[] = [
        {
          id: 'p1',
          timestamp: new Date().toISOString(),
          oldPriceCents: null,
          newPriceCents: 3000,
          changeCents: null,
          changePercent: null,
          source: 'import',
        },
      ];

      const result = analyzePriceFluctuations(history);
      expect(result.currentPriceCents).toBe(3000);
      expect(result.minPriceCents).toBe(3000);
      expect(result.maxPriceCents).toBe(3000);
      expect(result.averagePriceCents).toBe(3000);
      expect(result.trend).toBe('stable');
      expect(result.volatilityScore).toBe(0);
    });

    it('identifies rising trend and detects price surge pattern', () => {
      const history: PriceHistoryPoint[] = [
        {
          id: 'p1',
          timestamp: '2026-08-01T00:00:00Z',
          oldPriceCents: 2000,
          newPriceCents: 2200,
          changeCents: 200,
          changePercent: 10,
          source: 'scheduled',
        },
        {
          id: 'p2',
          timestamp: '2026-08-02T00:00:00Z',
          oldPriceCents: 2200,
          newPriceCents: 2600,
          changeCents: 400,
          changePercent: 18.18, // >= 15% spike
          source: 'scheduled',
        },
      ];

      const result = analyzePriceFluctuations(history);
      expect(result.trend).toBe('rising');
      expect(result.totalChangeCents).toBe(600); // 2600 - 2000
      expect(result.minPriceCents).toBe(2200);
      expect(result.maxPriceCents).toBe(2600);
      expect(result.detectedPatterns.some((p) => p.includes('Rapid price surge detected'))).toBe(true);
    });

    it('identifies high volatility when prices repeatedly reverse direction', () => {
      const history: PriceHistoryPoint[] = [
        {
          id: 'p1',
          timestamp: '2026-08-01T00:00:00Z',
          oldPriceCents: 3000,
          newPriceCents: 3500,
          changeCents: 500,
          changePercent: 16.6,
          source: 'scheduled',
        },
        {
          id: 'p2',
          timestamp: '2026-08-02T00:00:00Z',
          oldPriceCents: 3500,
          newPriceCents: 2800,
          changeCents: -700,
          changePercent: -20,
          source: 'scheduled',
        },
        {
          id: 'p3',
          timestamp: '2026-08-03T00:00:00Z',
          oldPriceCents: 2800,
          newPriceCents: 3400,
          changeCents: 600,
          changePercent: 21.4,
          source: 'scheduled',
        },
        {
          id: 'p4',
          timestamp: '2026-08-04T00:00:00Z',
          oldPriceCents: 3400,
          newPriceCents: 2900,
          changeCents: -500,
          changePercent: -14.7,
          source: 'scheduled',
        },
      ];

      const result = analyzePriceFluctuations(history);
      expect(result.trend).toBe('volatile');
      expect(result.volatilityScore).toBeGreaterThan(30);
    });
  });

  describe('API Route (GET /api/products/[id]/price-history)', () => {
    it('returns 200 with chronological data and analytics for authenticated tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'ph-1',
            old_price_cents: 2000,
            new_price_cents: 2200,
            change_cents: 200,
            change_percent: '10.00',
            source: 'scheduled',
            created_at: '2026-08-01T12:00:00Z',
          },
          {
            id: 'ph-2',
            old_price_cents: 2200,
            new_price_cents: 2400,
            change_cents: 200,
            change_percent: '9.09',
            source: 'scheduled',
            created_at: '2026-08-02T12:00:00Z',
          },
        ],
        rowCount: 2,
      });

      const req = new NextRequest(
        `http://localhost/api/products/${TEST_PRODUCT_ID}/price-history`,
      );
      const res = await GET(req, { params: { id: TEST_PRODUCT_ID } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.productId).toBe(TEST_PRODUCT_ID);
      expect(json.data.history).toHaveLength(2);
      expect(json.data.analytics.currentPriceCents).toBe(2400);
      expect(json.data.analytics.trend).toBe('rising');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
