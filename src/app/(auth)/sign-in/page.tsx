import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
};

/**
 * Sign-In Screen — Stage 1 Stub
 *
 * Thin vertical slice entry point for the authenticated merchant workflow.
 * Uses next-auth credentials provider seeded from .env (dev only).
 *
 * TODO: @agent:forge Implement <SignInForm> component (email/password fields, submit, error state)
 * TODO: @agent:forge Wire next-auth signIn() action to form submit handler
 * TODO: @agent:scribe Document auth flow and session token structure in ADR
 *
 * Blueprint reference: Stage 1 — "Implement sign-in for development, roles, tenant-scoped tables"
 */
export default function SignInPage() {
  return (
    <main aria-label="Sign in to GhostCart">
      <h1>Sign In</h1>
      {/*
        TODO: @agent:forge Replace with <SignInForm /> component
        Must include: email field, password field, submit button, error state display
        Must NOT include: mock logic — wire to next-auth API route
      */}
      <p style={{ color: 'gray' }}>[SignInForm placeholder — Stage 1 scaffold]</p>
    </main>
  );
}
