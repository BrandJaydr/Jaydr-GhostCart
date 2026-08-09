
import NextAuth from 'next-auth';
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const devUserEmail = process.env.DEV_SEED_EMAIL;
        const devUserPassword = process.env.DEV_SEED_PASSWORD;

        if (
          credentials.email === devUserEmail &&
          credentials.password === devUserPassword
        ) {
          // For now, returning a static user object.
          // In the future, this would come from the database.
          return {
            id: 'dev-user-1',
            name: 'Dev User',
            email: devUserEmail,
            tenantId: process.env.DEV_TENANT_ID || 'tenant_dev_001',
          };
        }

        return null;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
