/**
 * PATCH /api/auth/me/password
 *
 * Allows a signed-in user to change their own password.
 * Verifies the current password before accepting the new one.
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { z } from 'zod';

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

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

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', parsed.error.flatten().fieldErrors, 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    // Load current hashed password
    const result = await db.query<{ hashed_password: string | null }>(
      `SELECT hashed_password FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    const user = result.rows[0];
    if (!user) return apiError('User not found', undefined, 404);

    // Verify current password
    const isValid = verifyPassword(currentPassword, user.hashed_password ?? '');
    if (!isValid) {
      return apiError('Current password is incorrect', undefined, 401);
    }

    // Hash and save new password
    const newHash = hashPassword(newPassword);
    await db.query(`UPDATE users SET hashed_password = $1 WHERE id = $2`, [newHash, userId]);

    logger.info('auth', 'Password changed', { userId });
    return apiSuccess({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('auth', 'PATCH /api/auth/me/password failed', err);
    return apiError('Failed to change password', undefined, 500);
  }
}
