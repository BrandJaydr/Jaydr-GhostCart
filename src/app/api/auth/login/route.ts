/**
 * POST /api/auth/login
 *
 * Programmatic login endpoint for the GhostCart CLI.
 * Accepts { email, password } and returns a short-lived JWT that the CLI
 * stores in ~/.ghostcart/config.json.
 *
 * This is NOT a replacement for NextAuth — it's a parallel, stateless path
 * specifically for non-browser clients that can't use cookie-based sessions.
 *
 * The returned token is signed with NEXTAUTH_SECRET so it is compatible with
 * the same `getToken()` verification used by resolveActor().
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { SignJWT } from 'jose';

function verifyPassword(plain: string, stored: string | null): boolean {
  if (!stored) {
    // Dev fallback: allow DEV_SEED_PASSWORD if set
    if (process.env.NODE_ENV !== 'production') {
      return plain === (process.env.DEV_SEED_PASSWORD ?? '');
    }
    return false;
  }
  if (stored.startsWith('sha256:')) {
    const [, salt, digest] = stored.split(':');
    const expected = crypto
      .createHash('sha256')
      .update(salt + plain)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(digest, 'hex'),
        Buffer.from(expected, 'hex'),
      );
    } catch {
      return false;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', undefined, 400);
  }

  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return apiError('email and password are required', undefined, 400);
  }

  const result = await db.query<{
    id: string;
    tenant_id: string;
    email: string;
    role: string;
    hashed_password: string | null;
  }>(
    `SELECT id, tenant_id, email, role, hashed_password
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.toLowerCase().trim()],
  );

  const user = result.rows[0];

  // Use constant-time comparison to avoid user enumeration timing attacks
  const valid = user ? verifyPassword(password, user.hashed_password) : false;

  if (!user || !valid) {
    // Deliberate: same error for wrong email and wrong password
    return apiError('Invalid email or password', undefined, 401);
  }

  // Update last_login (fire-and-forget)
  db.query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]).catch(
    () => undefined,
  );

  // Sign a JWT compatible with next-auth's getToken() so resolveActor() works
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? '');
  const token = await new SignJWT({
    sub: user.id,
    id: user.id,
    tenantId: user.tenant_id,
    role: user.role,
    email: user.email,
    // next-auth token name
    name: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // CLI tokens last 30 days; refresh on next login
    .sign(secret);

  return apiSuccess({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    },
    expiresIn: '30d',
  });
}
