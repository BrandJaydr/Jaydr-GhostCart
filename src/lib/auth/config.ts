import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/** The seeded dev tenant from migration 0003 — the only tenant this stub may use. */
const SEEDED_DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Stage 1 stub: dev credentials are never valid outside development.
        // This check must run before any credential comparison.
        if (process.env.NODE_ENV !== 'development') {
          return null;
        }

        if (!credentials) {
          return null;
        }

        const devUserEmail = process.env.DEV_SEED_EMAIL;
        const devUserPassword = process.env.DEV_SEED_PASSWORD;
        const devTenantId = process.env.DEV_TENANT_ID;

        // Missing, blank or misconfigured seed values fail closed. In particular
        // the tenant must be the seeded UUID, not the legacy non-UUID template value.
        if (
          typeof devUserEmail !== 'string' ||
          devUserEmail.trim() === '' ||
          typeof devUserPassword !== 'string' ||
          devUserPassword.trim() === '' ||
          typeof devTenantId !== 'string' ||
          devTenantId.trim() === '' ||
          devTenantId !== SEEDED_DEV_TENANT_ID ||
          typeof credentials.email !== 'string' ||
          credentials.email.trim() === '' ||
          typeof credentials.password !== 'string' ||
          credentials.password.trim() === ''
        ) {
          return null;
        }

        if (
          credentials.email !== devUserEmail ||
          credentials.password !== devUserPassword
        ) {
          return null;
        }

        // For now, returning a static user object.
        // In the future, this would come from the database.
        return {
          id: 'dev-user-1',
          name: 'Dev User',
          email: devUserEmail,
          tenantId: devTenantId,
        };
      }
    })
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error -- custom property
        session.user.id = token.id;
        // @ts-expect-error -- custom property
        session.user.tenantId = token.tenantId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/sign-in',
  },
};
