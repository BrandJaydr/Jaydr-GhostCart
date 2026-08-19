/**
 * Margin Calculation Engine
 *
 * Calculates margins including fees, taxes, and shipping costs.
 * Deterministic calculations with configurable rounding rules.
 *
 * @agent:oracle Add tests for margin calculations
 */

import { db, withTenant } from '@/lib/db/index';

export type RoundingRule = 'nearest' | 'up' | 'down';

export interface MarginInput {
  sellingPriceCents: number;
  costCents: number;
  marketplace: string;
  countryCode?: string;
  stateCode?: string;
  tenantId?: string;
  carrier?: string;
  weightGrams?: number;
}

export interface MarginResult {
  marginPercent: number;
  profitCents: number;
  totalCostCents: number;
  breakdown: {
    costCents: number;
    feesCents: number;
    taxCents: number;
    shippingCents: number;
  };
}

export interface FeeStructure {
  id: string;
  marketplace: string;
  feeType: string;
  feeName: string;
  fixedAmountCents: number;
  percentageRate: number;
  minFeeCents: number | null;
  maxFeeCents: number | null;
}

/**
 * Calculate marketplace fees
 */
export async function calculateMarketplaceFees(
  marketplace: string,
  sellingPriceCents: number,
): Promise<number> {
  try {
    const result = await db.query(
      'SELECT margin.calculate_marketplace_fees($1, $2) as fees',
      [marketplace, sellingPriceCents],
    );

    return (result.rows[0].fees as number) || 0;
  } catch (err) {
    console.error('[margin-calculator] calculateMarketplaceFees error:', err);
    return 0; // Fail open
  }
}

/**
 * Calculate tax
 */
export async function calculateTax(
  countryCode: string,
  stateCode: string | null,
  priceCents: number,
): Promise<number> {
  try {
    const result = await db.query(
      'SELECT margin.calculate_tax($1, $2, $3) as tax',
      [countryCode, stateCode, priceCents],
    );

    return (result.rows[0].tax as number) || 0;
  } catch (err) {
    console.error('[margin-calculator] calculateTax error:', err);
    return 0; // Fail open
  }
}

/**
 * Calculate shipping cost within tenant RLS context
 */
export async function calculateShippingCost(
  tenantId: string,
  carrier: string | null,
  weightGrams: number | null,
): Promise<number> {
  try {
    return await withTenant(tenantId, async (client) => {
      const result = await client.query(
        'SELECT margin.calculate_shipping_cost($1, $2, $3) as shipping',
        [tenantId, carrier, weightGrams],
      );

      return (result.rows[0]?.shipping as number) || 0;
    });
  } catch (err) {
    console.error('[margin-calculator] calculateShippingCost error:', err);
    return 0; // Fail open
  }
}

/**
 * Apply rounding rule to a value in cents
 */
export function applyRounding(valueCents: number, rule: RoundingRule = 'nearest'): number {
  switch (rule) {
    case 'up':
      return Math.ceil(valueCents);
    case 'down':
      return Math.floor(valueCents);
    case 'nearest':
    default:
      return Math.round(valueCents);
  }
}

/**
 * Calculate margin with full breakdown
 */
export async function calculateMargin(input: MarginInput): Promise<MarginResult> {
  const {
    sellingPriceCents,
    costCents,
    marketplace,
    countryCode = 'US',
    stateCode = null,
    tenantId = null,
    carrier = null,
    weightGrams = null,
  } = input;

  // Calculate fees
  const feesCents = await calculateMarketplaceFees(marketplace, sellingPriceCents);

  // Calculate tax
  const taxCents = await calculateTax(countryCode, stateCode, sellingPriceCents);

  // Calculate shipping
  let shippingCents = 0;
  if (tenantId) {
    shippingCents = await calculateShippingCost(tenantId, carrier, weightGrams);
  }

  // Total cost = cost + fees + tax + shipping
  const totalCostCents = costCents + feesCents + taxCents + shippingCents;

  // Profit = selling price - total cost
  const profitCents = sellingPriceCents - totalCostCents;

  // Margin = (profit / selling price) * 100
  let marginPercent = 0;
  if (sellingPriceCents > 0) {
    marginPercent = (profitCents / sellingPriceCents) * 100;
  }

  return {
    marginPercent: Math.round(marginPercent * 100) / 100, // Round to 2 decimal places
    profitCents,
    totalCostCents,
    breakdown: {
      costCents,
      feesCents,
      taxCents,
      shippingCents,
    },
  };
}

/**
 * Get fee structures for a marketplace
 */
export async function getFeeStructures(marketplace: string): Promise<FeeStructure[]> {
  try {
    const result = await db.query(
      `SELECT id, marketplace, fee_type, fee_name, fixed_amount_cents, percentage_rate, min_fee_cents, max_fee_cents
       FROM fee_structures
       WHERE marketplace = $1
         AND effective_from <= now()
         AND (effective_to IS NULL OR effective_to > now())
       ORDER BY fee_type`,
      [marketplace],
    );

    return result.rows.map((row) => ({
      id: row.id,
      marketplace: row.marketplace,
      feeType: row.fee_type,
      feeName: row.fee_name,
      fixedAmountCents: row.fixed_amount_cents,
      percentageRate: parseFloat(row.percentage_rate),
      minFeeCents: row.min_fee_cents,
      maxFeeCents: row.max_fee_cents,
    }));
  } catch (err) {
    console.error('[margin-calculator] getFeeStructures error:', err);
    return [];
  }
}
