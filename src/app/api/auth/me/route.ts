/**
 * GET  /api/auth/me          — Return the current user's profile from DB.
 * PATCH /api/auth/me         — Update display name (name field).
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError('Unauthorized', undefined, 401);

  const userId = (session.user as { id?: string }).id;
  if (!userId) return apiError('Unauthorized', undefined, 401);

  try {
    const result = await db.query<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      tenant_id: string;
      created_at: string;
      last_login: string | null;
    }>(
      `SELECT id, email, name, role, tenant_id, created_at, last_login
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );

    const user = result.rows[0];
    if (!user) return apiError('User not found', undefined, 404);

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (err) {
    logger.error('auth', 'GET /api/auth/me failed', err);
    return apiError('Failed to load profile', undefined, 500);
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiError('Unauthorized', undefined, 401);

  const userId = (session.user as { id?: string }).id;
  if (!userId) return apiError('Unauthorized', undefined, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', undefined, 400);
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', parsed.error.flatten().fieldErrors, 400);
  }

  const { name } = parsed.data;

  try {
    await db.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);

    logger.info('auth', 'Profile updated', { userId, name });
    return apiSuccess({ name });
  } catch (err) {
    logger.error('auth', 'PATCH /api/auth/me failed', err);
    return apiError('Failed to update profile', undefined, 500);
  }
}
