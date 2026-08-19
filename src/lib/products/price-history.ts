/**
 * Price History Tracking & Fluctuation Analytics Engine
 *
 * Provides chronological tracking and statistical pattern analysis
 * for supplier price movements over time.
 */

import { withTenant } from '@/lib/db/index';

export interface PriceHistoryPoint {
  id: string;
  timestamp: string;
  oldPriceCents: number | null;
  newPriceCents: number;
  changeCents: number | null;
  changePercent: number | null;
  source: string;
}

export type PriceTrend = 'stable' | 'rising' | 'falling' | 'volatile';

export interface PriceAnalytics {
  currentPriceCents: number;
  minPriceCents: number;
  maxPriceCents: number;
  averagePriceCents: number;
  totalChangeCents: number;
  totalChangePercent: number;
  trend: PriceTrend;
  volatilityScore: number; // 0 (rock solid) to 100 (highly volatile)
  detectedPatterns: string[];
}

export interface ProductPriceHistoryResult {
  productId: string;
  history: PriceHistoryPoint[];
  analytics: PriceAnalytics;
}

/**
 * Fetch chronological price history records for a product within tenant RLS context
 */
export async function fetchPriceHistory(
  productId: string,
  tenantId: string,
  limit = 100,
): Promise<PriceHistoryPoint[]> {
  try {
    return await withTenant(tenantId, async (client) => {
      const result = await client.query(
        `SELECT id, old_price_cents, new_price_cents, change_cents, change_percent, source, created_at
         FROM price_history
         WHERE product_id = $1 AND tenant_id = $2
         ORDER BY created_at ASC
         LIMIT $3`,
        [productId, tenantId, limit],
      );

      return result.rows.map((row) => ({
        id: row.id,
        timestamp: new Date(row.created_at).toISOString(),
        oldPriceCents: row.old_price_cents,
        newPriceCents: row.new_price_cents,
        changeCents: row.change_cents,
        changePercent: row.change_percent ? parseFloat(row.change_percent) : null,
        source: row.source,
      }));
    });
  } catch (err) {
    console.error('[price-history] fetchPriceHistory error:', err);
    return [];
  }
}

/**
 * Analyze price history points to detect volatility, trends, and patterns
 */
export function analyzePriceFluctuations(
  history: PriceHistoryPoint[],
  fallbackCurrentPriceCents = 0,
): PriceAnalytics {
  if (!history || history.length === 0) {
    return {
      currentPriceCents: fallbackCurrentPriceCents,
      minPriceCents: fallbackCurrentPriceCents,
      maxPriceCents: fallbackCurrentPriceCents,
      averagePriceCents: fallbackCurrentPriceCents,
      totalChangeCents: 0,
      totalChangePercent: 0,
      trend: 'stable',
      volatilityScore: 0,
      detectedPatterns: ['Insufficient price history (0 data points)'],
    };
  }

  const prices = history.map((p) => p.newPriceCents);
  const minPriceCents = Math.min(...prices);
  const maxPriceCents = Math.max(...prices);
  const currentPriceCents = prices[prices.length - 1];
  const averagePriceCents = Math.round(prices.reduce((acc, p) => acc + p, 0) / prices.length);

  const firstPriceCents = history[0].oldPriceCents ?? history[0].newPriceCents;
  const totalChangeCents = currentPriceCents - firstPriceCents;
  const totalChangePercent =
    firstPriceCents > 0
      ? Math.round(((totalChangeCents / firstPriceCents) * 100) * 100) / 100
      : 0;

  if (history.length === 1) {
    return {
      currentPriceCents,
      minPriceCents,
      maxPriceCents,
      averagePriceCents,
      totalChangeCents,
      totalChangePercent,
      trend: 'stable',
      volatilityScore: 0,
      detectedPatterns: ['Initial price established'],
    };
  }

  // Statistical volatility calculation (Relative Standard Deviation)
  const mean = averagePriceCents;
  const variance =
    prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const relativeStdDev = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Calculate direction reversals
  let reversals = 0;
  let lastDirection = 0; // -1 = down, 1 = up
  for (let i = 0; i < history.length; i++) {
    const diff = (history[i].changeCents ?? 0);
    if (diff !== 0) {
      const currentDirection = diff > 0 ? 1 : -1;
      if (lastDirection !== 0 && currentDirection !== lastDirection) {
        reversals++;
      }
      lastDirection = currentDirection;
    }
  }

  // Volatility score: scale 0 to 100 based on standard deviation and reversals
  const rawVolatility = (relativeStdDev * 2.5) + (reversals * 10);
  const volatilityScore = Math.min(100, Math.round(rawVolatility));

  // Determine trend direction
  let trend: PriceTrend = 'stable';
  if (reversals >= 3 && relativeStdDev > 4) {
    trend = 'volatile';
  } else if (totalChangePercent >= 3) {
    trend = 'rising';
  } else if (totalChangePercent <= -3) {
    trend = 'falling';
  }

  // Pattern detection rules
  const detectedPatterns: string[] = [];

  // Check for rapid spikes or drops
  const largeSpikes = history.filter((p) => (p.changePercent ?? 0) >= 15);
  const largeDrops = history.filter((p) => (p.changePercent ?? 0) <= -15);

  if (largeSpikes.length > 0) {
    detectedPatterns.push(
      `Rapid price surge detected (+${Math.round(largeSpikes[largeSpikes.length - 1].changePercent ?? 0)}%)`,
    );
  }

  if (largeDrops.length > 0) {
    detectedPatterns.push(
      `Sharp price reduction detected (${Math.round(largeDrops[largeDrops.length - 1].changePercent ?? 0)}%)`,
    );
  }

  if (history.length >= 5) {
    detectedPatterns.push(
      `High change frequency: ${history.length} price shifts recorded over sync timeline`,
    );
  }

  if (trend === 'falling' && reversals === 0) {
    detectedPatterns.push('Consistent downward price erosion');
  } else if (trend === 'rising' && reversals === 0) {
    detectedPatterns.push('Consistent upward price appreciation');
  }

  if (detectedPatterns.length === 0) {
    detectedPatterns.push('Normal price stability');
  }

  return {
    currentPriceCents,
    minPriceCents,
    maxPriceCents,
    averagePriceCents,
    totalChangeCents,
    totalChangePercent,
    trend,
    volatilityScore,
    detectedPatterns,
  };
}

/**
 * Full product price history resolution helper
 */
export async function getProductPriceHistoryWithAnalytics(
  productId: string,
  tenantId: string,
  fallbackPriceCents = 0,
): Promise<ProductPriceHistoryResult> {
  const history = await fetchPriceHistory(productId, tenantId);
  const analytics = analyzePriceFluctuations(history, fallbackPriceCents);

  return {
    productId,
    history,
    analytics,
  };
}
