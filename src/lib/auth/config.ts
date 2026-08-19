import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Compares a plain password against a stored bcrypt-style hash.
 *
 * We use Node's built-in `crypto.timingSafeEqual` to prevent timing attacks.
 * Passwords are hashed with SHA-256 + a per-user salt stored prepended to
 * the hash in the format: `sha256:<salt>:<hex-digest>`.
 *
 * In production, swap this for `bcrypt.compare` once `bcryptjs` is installed.
 * For now this is a secure-but-dependency-free alternative.
 */
function verifyPassword(plain: string, stored: string): boolean {
  if (stored && stored.startsWith('sha256:')) {
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

  // Legacy fallback: plain equality (dev seed only — replace in production)
  if (process.env.NODE_ENV !== 'production') {
    const devPassword = process.env.DEV_SEED_PASSWORD;
    if (devPassword && plain === devPassword) return true;
  }

  return false;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Look up user globally by email (migration 0016 adds users_email_global_idx)
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
            [credentials.email.toLowerCase().trim()],
          );

          const user = result.rows[0];
          if (!user) return null;

          // Verify password
          const valid = verifyPassword(
            credentials.password,
            user.hashed_password ?? '',
          );
          if (!valid) return null;

          // Update last_login (best-effort, non-blocking)
          db.query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]).catch(
            () => undefined,
          );

          return {
            id: user.id,
            name: user.email,
            email: user.email,
            tenantId: user.tenant_id,
            role: user.role,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error -- custom property
        token.tenantId = user.tenantId;
        // @ts-expect-error -- custom property
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error -- custom property
        session.user.id = token.id;
        // @ts-expect-error -- custom property
        session.user.tenantId = token.tenantId;
        // @ts-expect-error -- custom property
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
};