import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { db, DEV_TENANT_ID } from '@/lib/db/index.js';

/**
 * Schema for feature flag update
 */
const FlagUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  enabledForTenants: z.array(z.string().uuid()).optional(),
  enabledForUsers: z.array(z.string().uuid()).optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
});

/**
 * GET /api/admin/feature-flags
 * List all feature flags
 */
export async function GET(req: NextRequest) {
  try {
    const result = await db.query(
      `SELECT key, name, description, enabled, enabled_for_tenants,
              enabled_for_users, rollout_percentage, created_at, updated_at
       FROM feature_flags
       ORDER BY key`,
    );

    const flags = result.rows.map((row) => ({
      key: row.key,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      enabledForTenants: row.enabled_for_tenants,
      enabledForUsers: row.enabled_for_users,
      rolloutPercentage: row.rollout_percentage,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return apiSuccess(flags);
  } catch (err) {
    console.error('[api/admin/feature-flags] GET error:', err);
    return apiError('Failed to fetch feature flags', null, 500);
  }
}

/**
 * PATCH /api/admin/feature-flags/[key]
 * Update a feature flag
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const key = params.key;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = FlagUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { enabled, enabledForTenants, enabledForUsers, rolloutPercentage } = parseResult.data;

  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex}`);
      values.push(enabled);
      paramIndex++;
    }

    if (enabledForTenants !== undefined) {
      updates.push(`enabled_for_tenants = $${paramIndex}`);
      values.push(enabledForTenants);
      paramIndex++;
    }

    if (enabledForUsers !== undefined) {
      updates.push(`enabled_for_users = $${paramIndex}`);
      values.push(enabledForUsers);
      paramIndex++;
    }

    if (rolloutPercentage !== undefined) {
      updates.push(`rollout_percentage = $${paramIndex}`);
      values.push(rolloutPercentage);
      paramIndex++;
    }

    if (updates.length === 0) {
      return apiError('No fields to update', null, 400);
    }

    updates.push(`updated_at = now()`);
    values.push(key);

    const result = await db.query(
      `UPDATE feature_flags SET ${updates.join(', ')} WHERE key = $${paramIndex} RETURNING *`,
      values,
    );

    if ((result.rowCount ?? 0) === 0) {
      return apiError('Feature flag not found', null, 404);
    }

    const flag = result.rows[0];

    return apiSuccess({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      enabledForTenants: flag.enabled_for_tenants,
      enabledForUsers: flag.enabled_for_users,
      rolloutPercentage: flag.rollout_percentage,
      updatedAt: flag.updated_at,
    });
  } catch (err) {
    console.error('[api/admin/feature-flags] PATCH error:', err);
    return apiError('Failed to update feature flag', null, 500);
  }
}
