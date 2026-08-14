import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { db } from '@/lib/db/index';

/**
 * Schema for beta user invitation
 */
const InviteBetaUserSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  phase: z.enum(['phase1', 'phase2', 'phase3']).optional(),
});

/**
 * GET /api/admin/beta-users
 * List all beta users
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const phase = url.searchParams.get('phase');
  const status = url.searchParams.get('status');

  try {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (phase) {
      conditions.push(`phase = $${paramIndex}`);
      values.push(phase);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT bu.id, bu.tenant_id, bu.user_id, bu.phase, bu.status,
              bu.invited_at, bu.accepted_at, bu.feedback_count,
              t.name as tenant_name, u.email as user_email
       FROM beta_users bu
       JOIN tenants t ON bu.tenant_id = t.id
       JOIN users u ON bu.user_id = u.id
       ${whereClause}
       ORDER BY bu.invited_at DESC`,
      values,
    );

    const betaUsers = result.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      tenantName: row.tenant_name,
      userEmail: row.user_email,
      phase: row.phase,
      status: row.status,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
      feedbackCount: row.feedback_count,
    }));

    return apiSuccess(betaUsers);
  } catch (err) {
    console.error('[api/admin/beta-users] GET error:', err);
    return apiError('Failed to fetch beta users', null, 500);
  }
}

/**
 * POST /api/admin/beta-users
 * Invite a user to beta program
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = InviteBetaUserSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { tenantId, userId, phase = 'phase1' } = parseResult.data;

  try {
    // Check if user is already in beta
    const existing = await db.query(
      'SELECT id FROM beta_users WHERE tenant_id = $1 AND user_id = $2 LIMIT 1',
      [tenantId, userId],
    );

    if ((existing.rowCount ?? 0) > 0) {
      return apiError('User is already in beta program', null, 400);
    }

    // Create beta user invitation
    const result = await db.query(
      `INSERT INTO beta_users (tenant_id, user_id, phase, status)
       VALUES ($1, $2, $3, 'invited')
       RETURNING id, invited_at`,
      [tenantId, userId, phase],
    );

    // Grant beta access via feature flag
    await db.query(
      `UPDATE feature_flags
       SET enabled_for_users = array_append(enabled_for_users, $1)
       WHERE key = 'beta_access_granted'`,
      [userId],
    );

    return apiSuccess({
      id: result.rows[0].id,
      tenantId,
      userId,
      phase,
      status: 'invited',
      invitedAt: result.rows[0].invited_at,
    });
  } catch (err) {
    console.error('[api/admin/beta-users] POST error:', err);
    return apiError('Failed to invite beta user', null, 500);
  }
}

/**
 * PATCH /api/admin/beta-users/[id]
 * Update beta user status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const { status } = body as { status?: string };

  if (!status || !['invited', 'accepted', 'declined', 'removed'].includes(status)) {
    return apiError('Invalid status', null, 400);
  }

  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    updates.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;

    if (status === 'accepted') {
      updates.push(`accepted_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;
    }

    values.push(id);

    const result = await db.query(
      `UPDATE beta_users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    if ((result.rowCount ?? 0) === 0) {
      return apiError('Beta user not found', null, 404);
    }

    return apiSuccess({
      id: result.rows[0].id,
      status: result.rows[0].status,
      acceptedAt: result.rows[0].accepted_at,
    });
  } catch (err) {
    console.error('[api/admin/beta-users] PATCH error:', err);
    return apiError('Failed to update beta user', null, 500);
  }
}
