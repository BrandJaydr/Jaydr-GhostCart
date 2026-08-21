/**
 * Repricing Engine
 *
 * Generates repricing suggestions based on merchant rules and competitor data.
 * Supports dry-run mode and global pause controls.
 *
 * @agent:oracle Add tests for repricing engine
 */

import { db, withTenant } from '@/lib/db/index';
import type { PoolClient } from 'pg';
import { logger } from '@/lib/logger';

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
export async function isRepricingPaused(tenantId?: string, client?: PoolClient): Promise<boolean> {
  try {
    const execute = async (c: PoolClient | typeof db) => {
      const result = await c.query(
        'SELECT repricing.is_paused($1) as paused',
        [tenantId || null],
      );
      return (result.rows[0]?.paused as boolean) || false;
    };

    if (client) {
      return await execute(client);
    }

    if (tenantId) {
      return await withTenant(tenantId, async (c) => {
        return await execute(c);
      });
    }

    return await execute(db);
  } catch (err) {
    logger.error('repricing-engine', 'isRepricingPaused error', err);
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
  client?: PoolClient,
): Promise<boolean> {
  try {
    const execute = async (c: PoolClient | typeof db) => {
      await c.query(
        'SELECT repricing.set_pause($1, $2, $3, $4) as success',
        [tenantId, paused, reason || null, userId || null],
      );
      return true;
    };

    if (client) {
      return await execute(client);
    }

    if (tenantId) {
      return await withTenant(tenantId, async (c) => {
        return await execute(c);
      });
    }

    return await execute(db);
  } catch (err) {
    logger.error('repricing-engine', 'setRepricingPause error', err);
    return false;
  }
}

/**
 * Get repricing rules for a tenant
 */
export async function getRepricingRules(tenantId: string, client?: PoolClient): Promise<RepricingRule[]> {
  try {
    const execute = async (c: PoolClient) => {
      const result = await c.query(
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
    };

    if (client) {
      return await execute(client);
    }

    return await withTenant(tenantId, async (c) => {
      return await execute(c);
    });
  } catch (err) {
    logger.error('repricing-engine', 'getRepricingRules error', err);
    return [];
  }
}

/**
 * Generate a repricing suggestion within tenant context
 */
export async function generateSuggestion(
  input: GenerateSuggestionInput,
  client?: PoolClient,
): Promise<string | null> {
  const { tenantId, listingId, currentPriceCents, costCents, competitorPriceCents } = input;

  try {
    const execute = async (c: PoolClient) => {
      // Retrieve rules to validate
      const rulesResult = await c.query(
        `SELECT floor_price_cents, ceiling_price_cents, margin_target_percent, beat_by_cents, beat_by_percent, enabled
         FROM repricing_rules
         WHERE tenant_id = $1 AND enabled = true
         ORDER BY updated_at DESC
         LIMIT 1`,
        [tenantId],
      );

      const rule = rulesResult.rows[0];
      if (!rule) {
        return null;
      }

      const floorPriceCents = rule.floor_price_cents;
      const ceilingPriceCents = rule.ceiling_price_cents;

      // Validate floor and ceiling prices are correct
      if (floorPriceCents < 0 || ceilingPriceCents < 0 || floorPriceCents > ceilingPriceCents) {
        throw new Error(`Invalid repricing rule bounds: floor=${floorPriceCents}, ceiling=${ceilingPriceCents}`);
      }

      // Call the database function to generate the suggestion
      const result = await c.query(
        `SELECT repricing.generate_suggestion($1, $2, $3, $4, $5) as suggestion_id`,
        [
          tenantId,
          listingId,
          currentPriceCents,
          costCents,
          competitorPriceCents || null,
        ],
      );

      return (result.rows[0]?.suggestion_id as string) || null;
    };

    if (client) {
      return await execute(client);
    }

    return await withTenant(tenantId, async (c) => {
      return await execute(c);
    });
  } catch (err) {
    logger.error('repricing-engine', 'generateSuggestion error', err);
    return null;
  }
}

export const generateRepricingSuggestion = generateSuggestion;

/**
 * Get pending repricing suggestions for a tenant
 */
export async function getPendingSuggestions(tenantId: string, client?: PoolClient): Promise<RepricingSuggestion[]> {
  try {
    const execute = async (c: PoolClient) => {
      const result = await c.query(
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
    };

    if (client) {
      return await execute(client);
    }

    return await withTenant(tenantId, async (c) => {
      return await execute(c);
    });
  } catch (err) {
    logger.error('repricing-engine', 'getPendingSuggestions error', err);
    return [];
  }
}

/**
 * Approve a repricing suggestion
 */
export async function approveSuggestion(suggestionId: string, tenantId?: string, client?: PoolClient): Promise<boolean> {
  try {
    const execute = async (c: PoolClient | typeof db) => {
      await c.query(
        `UPDATE repricing_suggestions
         SET status = 'approved'
         WHERE id = $1 AND status = 'pending'`,
        [suggestionId],
      );
      return true;
    };

    if (client) {
      return await execute(client);
    }

    if (tenantId) {
      return await withTenant(tenantId, async (c) => {
        return await execute(c);
      });
    }

    return await execute(db);
  } catch (err) {
    logger.error('repricing-engine', 'approveSuggestion error', err);
    return false;
  }
}

/**
 * Reject a repricing suggestion
 */
export async function rejectSuggestion(suggestionId: string, tenantId?: string, client?: PoolClient): Promise<boolean> {
  try {
    const execute = async (c: PoolClient | typeof db) => {
      await c.query(
        `UPDATE repricing_suggestions
         SET status = 'rejected'
         WHERE id = $1 AND status = 'pending'`,
        [suggestionId],
      );
      return true;
    };

    if (client) {
      return await execute(client);
    }

    if (tenantId) {
      return await withTenant(tenantId, async (c) => {
        return await execute(c);
      });
    }

    return await execute(db);
  } catch (err) {
    logger.error('repricing-engine', 'rejectSuggestion error', err);
    return false;
  }
}

/**
 * Apply an approved repricing suggestion
 */
export async function applySuggestion(
  suggestionId: string,
  userId?: string,
  tenantId?: string,
  client?: PoolClient,
): Promise<boolean> {
  try {
    const execute = async (c: PoolClient | typeof db) => {
      const result = await c.query(
        'SELECT repricing.apply_suggestion($1, $2) as success',
        [suggestionId, userId || null],
      );
      return (result.rows[0]?.success as boolean) || false;
    };

    if (client) {
      return await execute(client);
    }

    if (tenantId) {
      return await withTenant(tenantId, async (c) => {
        return await execute(c);
      });
    }

    return await execute(db);
  } catch (err) {
    logger.error('repricing-engine', 'applySuggestion error', err);
    return false;
  }
}

/**
 * Get repricing history for a tenant
 */
export async function getRepricingHistory(
  tenantId: string,
  listingId?: string,
  client?: PoolClient,
): Promise<Record<string, unknown>[]> {
  try {
    const execute = async (c: PoolClient) => {
      const conditions: string[] = ['rh.tenant_id = $1'];
      const values: unknown[] = [tenantId];
      let paramIndex = 2;

      if (listingId) {
        conditions.push(`rh.listing_id = $${paramIndex}`);
        values.push(listingId);
        paramIndex++;
      }

      const result = await c.query(
        `SELECT rh.*, l.title as listing_title
         FROM repricing_history rh
         JOIN listings l ON rh.listing_id = l.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY rh.applied_at DESC
         LIMIT 100`,
        values,
      );

      return result.rows as Record<string, unknown>[];
    };

    if (client) {
      return await execute(client);
    }

    return await withTenant(tenantId, async (c) => {
      return await execute(c);
    });
  } catch (err) {
    logger.error('repricing-engine', 'getRepricingHistory error', err);
    return [];
  }
}

