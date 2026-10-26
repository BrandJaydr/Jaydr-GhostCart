/**
 * Repricing Engine
 *
 * Generates repricing suggestions based on merchant rules and competitor data.
 * Supports dry-run mode and global pause controls.
 *
 * @agent:oracle Add tests for repricing engine
 */

import { db } from '@/lib/db/index';

export interface RepricingRule {
  id: string;
  tenantId: string;
  ruleName: string;
  floorPriceCents: number;
  ceilingPriceCents: number;
  marginTargetPercent: number;
  beatByCents: number;
  beatByPercent: number;
  enabled: boolean;
}

export interface RepricingSuggestion {
  id: string;
  tenantId: string;
  listingId: string;
  currentPriceCents: number;
  suggestedPriceCents: number;
  reason: string;
  competitorPriceCents: number | null;
  currentMarginPercent: number;
  suggestedMarginPercent: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  generatedAt: Date;
  expiresAt: Date;
}

export interface GenerateSuggestionInput {
  tenantId: string;
  listingId: string;
  currentPriceCents: number;
  costCents: number;
  competitorPriceCents?: number;
}

/**
 * Check if repricing is paused (global or tenant-specific)
 */
export async function isRepricingPaused(tenantId?: string): Promise<boolean> {
  try {
    const result = await db.query(
      'SELECT repricing.is_paused($1) as paused',
      [tenantId || null],
    );

    return (result.rows[0].paused as boolean) || false;
  } catch (err) {
    console.error('[repricing-engine] isRepricingPaused error:', err);
    return false; // Fail open
  }
}

/**
 * Set pause state for repricing
 */
export async function setRepricingPause(
  tenantId: string | null,
  paused: boolean,
  reason?: string,
  userId?: string,
): Promise<boolean> {
  try {
    await db.query(
      'SELECT repricing.set_pause($1, $2, $3, $4) as success',
      [tenantId, paused, reason || null, userId || null],
    );

    return true;
  } catch (err) {
    console.error('[repricing-engine] setRepricingPause error:', err);
    return false;
  }
}

/**
 * Get repricing rules for a tenant
 */
export async function getRepricingRules(tenantId: string): Promise<RepricingRule[]> {
  try {
    const result = await db.query(
      `SELECT id, tenant_id, rule_name, floor_price_cents, ceiling_price_cents,
              margin_target_percent, beat_by_cents, beat_by_percent, enabled
       FROM repricing_rules
       WHERE tenant_id = $1
       ORDER BY updated_at DESC`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      ruleName: row.rule_name,
      floorPriceCents: row.floor_price_cents,
      ceilingPriceCents: row.ceiling_price_cents,
      marginTargetPercent: parseFloat(row.margin_target_percent),
      beatByCents: row.beat_by_cents,
      beatByPercent: parseFloat(row.beat_by_percent),
      enabled: row.enabled,
    }));
  } catch (err) {
    console.error('[repricing-engine] getRepricingRules error:', err);
    return [];
  }
}

/**
 * Generate a repricing suggestion
 */
export async function generateSuggestion(
  input: GenerateSuggestionInput,
): Promise<string | null> {
  try {
    const result = await db.query(
      `SELECT repricing.generate_suggestion($1, $2, $3, $4, $5) as suggestion_id`,
      [
        input.tenantId,
        input.listingId,
        input.currentPriceCents,
        input.costCents,
        input.competitorPriceCents || null,
      ],
    );

    return (result.rows[0].suggestion_id as string) || null;
  } catch (err) {
    console.error('[repricing-engine] generateSuggestion error:', err);
    return null;
  }
}

/**
 * Get pending repricing suggestions for a tenant
 */
export async function getPendingSuggestions(tenantId: string): Promise<RepricingSuggestion[]> {
  try {
    const result = await db.query(
      `SELECT id, tenant_id, listing_id, current_price_cents, suggested_price_cents,
              reason, competitor_price_cents, current_margin_percent, suggested_margin_percent,
              status, generated_at, expires_at
       FROM repricing_suggestions
       WHERE tenant_id = $1 AND status = 'pending' AND expires_at > now()
       ORDER BY generated_at DESC`,
      [tenantId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      listingId: row.listing_id,
      currentPriceCents: row.current_price_cents,
      suggestedPriceCents: row.suggested_price_cents,
      reason: row.reason,
      competitorPriceCents: row.competitor_price_cents,
      currentMarginPercent: parseFloat(row.current_margin_percent),
      suggestedMarginPercent: parseFloat(row.suggested_margin_percent),
      status: row.status,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
    }));
  } catch (err) {
    console.error('[repricing-engine] getPendingSuggestions error:', err);
    return [];
  }
}

/**
 * Approve a repricing suggestion
 */
export async function approveSuggestion(suggestionId: string): Promise<boolean> {
  try {
    await db.query(
      `UPDATE repricing_suggestions
       SET status = 'approved'
       WHERE id = $1 AND status = 'pending'`,
      [suggestionId],
    );

    return true;
  } catch (err) {
    console.error('[repricing-engine] approveSuggestion error:', err);
    return false;
  }
}

/**
 * Reject a repricing suggestion
 */
export async function rejectSuggestion(suggestionId: string): Promise<boolean> {
  try {
    await db.query(
      `UPDATE repricing_suggestions
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'`,
      [suggestionId],
    );

    return true;
  } catch (err) {
    console.error('[repricing-engine] rejectSuggestion error:', err);
    return false;
  }
}

/**
 * Apply an approved repricing suggestion
 */
export async function applySuggestion(suggestionId: string, userId?: string): Promise<boolean> {
  try {
    const result = await db.query(
      'SELECT repricing.apply_suggestion($1, $2) as success',
      [suggestionId, userId || null],
    );

    return (result.rows[0].success as boolean) || false;
  } catch (err) {
    console.error('[repricing-engine] applySuggestion error:', err);
    return false;
  }
}

/**
 * Get repricing history for a tenant
 */
export async function getRepricingHistory(tenantId: string, listingId?: string): Promise<any[]> {
  try {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (listingId) {
      conditions.push(`listing_id = $${paramIndex}`);
      values.push(listingId);
      paramIndex++;
    }

    const result = await db.query(
      `SELECT rh.*, l.title as listing_title
       FROM repricing_history rh
       JOIN listings l ON rh.listing_id = l.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY rh.applied_at DESC
       LIMIT 100`,
      values,
    );

    return result.rows;
  } catch (err) {
    console.error('[repricing-engine] getRepricingHistory error:', err);
    return [];
  }
}
