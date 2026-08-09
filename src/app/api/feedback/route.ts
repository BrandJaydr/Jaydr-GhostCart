import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { z } from 'zod';
import { db, DEV_TENANT_ID } from '@/lib/db/index.js';

/**
 * Schema for feedback submission
 */
const FeedbackSchema = z.object({
  category: z.enum(['bug', 'feature_request', 'improvement', 'other']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

/**
 * POST /api/feedback
 * Submit feedback
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON request body', null, 400);
  }

  const parseResult = FeedbackSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('Validation failed', parseResult.error.flatten().fieldErrors, 400);
  }

  const { category, title, description, priority = 'medium' } = parseResult.data;

  // @agent:forge Replace this with the tenantId and userId resolved from the
  // authenticated session once next-auth is configured.
  const tenantId = DEV_TENANT_ID;
  const userId = '00000000-0000-0000-0000-000000000001';

  try {
    const result = await db.query(
      `INSERT INTO feedback (tenant_id, user_id, category, title, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')
       RETURNING id, created_at`,
      [tenantId, userId, category, title, description, priority],
    );

    // Increment feedback count for beta user
    await db.query(
      `UPDATE beta_users
       SET feedback_count = feedback_count + 1
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId],
    );

    return apiSuccess({
      id: result.rows[0].id,
      category,
      title,
      priority,
      status: 'new',
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('[api/feedback] POST error:', err);
    return apiError('Failed to submit feedback', null, 500);
  }
}

/**
 * GET /api/feedback
 * List feedback for current tenant
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');

  // @agent:forge Replace with session tenantId
  const tenantId = DEV_TENANT_ID;

  try {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await db.query(
      `SELECT id, category, title, description, priority, status, created_at, updated_at
       FROM feedback
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      values,
    );

    const feedback = result.rows.map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return apiSuccess(feedback);
  } catch (err) {
    console.error('[api/feedback] GET error:', err);
    return apiError('Failed to fetch feedback', null, 500);
  }
}
