import crypto from 'crypto';

/**
 * Verifies a plain-text password against a stored `sha256:<salt>:<digest>` hash.
 * Compatible with the hash produced by `hashPassword()` and with the local
 * `verifyPassword` in `src/lib/auth/config.ts` (intentionally kept separate so
 * that the config.ts fallback logic is not affected).
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !stored.startsWith('sha256:')) return false;
  const [, salt, digest] = stored.split(':');
  if (!salt || !digest) return false;
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

/**
 * Password + password-reset token utilities for the public auth routes.
 *
 * The hash format is the same `sha256:<salt>:<digest>` scheme verified in
 * src/lib/auth/config.ts and src/app/api/auth/login/route.ts, so accounts
 * created here authenticate with the existing Credentials provider.
 */

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto
    .createHash('sha256')
    .update(salt + plain)
    .digest('hex');
  return `sha256:${salt}:${digest}`;
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Creates a stateless, signed password-reset token (HMAC-SHA256 with
 * NEXTAUTH_SECRET). No DB table is required — the user id and expiry are
 * embedded in the payload and cannot be tampered with without the secret.
 *
 * TODO(notifications): when the notifications track lands, swap delivery
 * from dev logging to a transactional email and consider DB-backed tokens.
 */
export function createPasswordResetToken(userId: string): {
  token: string;
  expiresAt: number;
} {
  const secret = process.env.NEXTAUTH_SECRET ?? '';
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  const token = `${Buffer.from(payload, 'utf8').toString('base64url')}.${signature}`;
  return { token, expiresAt };
}

/**
 * Verifies a reset token. Returns the embedded user id when the signature
 * is valid and the token has not expired, otherwise null.
 */
export function verifyPasswordResetToken(token: string): string | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const [userId, expiresAtRaw] = payload.split('.');
    if (!userId || !expiresAtRaw) return null;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

    const expected = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET ?? '')
      .update(payload)
      .digest('base64url');

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    return userId;
  } catch {
    return null;
  }
}