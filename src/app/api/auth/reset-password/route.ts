/**
 * POST /api/auth/reset-password
 *
 * Public password-recovery completion. Verifies the signed reset token and
 * sets a new hashed password for the identified user.
 */

import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db } from '@/lib/db';
import { ResetPasswordSchema } from '@/lib/validation/schemas';
import { verifyPasswordResetToken, hashPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', undefined, 400);
  }

  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', parsed.error.flatten().fieldErrors, 400);
  }

  const userId = verifyPasswordResetToken(parsed.data.token);
  if (!userId) {
    return apiError('Reset token is invalid or has expired', undefined, 400);
  }

  try {
    const hashed = hashPassword(parsed.data.password);
    const result = await db.query('UPDATE users SET hashed_password = $1 WHERE id = $2', [
      hashed,
      userId,
    ]);
    if (!result.rowCount) {
      return apiError('Reset token is invalid or has expired', undefined, 400);
    }
    logger.info('auth', 'Password reset completed', { userId });
    return apiSuccess({ ok: true });
  } catch (err) {
    logger.error('auth', 'Password reset failed', err);
    return apiError('Could not reset password', undefined, 500);
  }
}