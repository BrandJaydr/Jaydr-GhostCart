/**
 * POST /api/auth/forgot-password
 *
 * Public password-recovery start. Generates a short-lived, signed reset token
 * for the matching user and (in non-production) returns/logs the reset link
 * so the flow is usable without email infrastructure.
 *
 * Always returns the same 200 shape whether or not the email exists, to avoid
 * user enumeration. TODO(notifications): deliver the link by email in
 * production once the notifications track lands.
 */

import type { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db } from '@/lib/db';
import { ForgotPasswordSchema } from '@/lib/validation/schemas';
import { createPasswordResetToken } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', undefined, 400);
  }

  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', parsed.error.flatten().fieldErrors, 400);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const result = await db.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email],
  );
  const user = result.rows[0];

  const baseUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  let devResetUrl: string | null = null;

  if (user) {
    const { token } = createPasswordResetToken(user.id);
    devResetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    logger.info('auth', 'Password reset requested', { email, devResetUrl });
  }

  return apiSuccess(
    user && process.env.NODE_ENV !== 'production' ? { ok: true, devResetUrl } : { ok: true },
  );
}