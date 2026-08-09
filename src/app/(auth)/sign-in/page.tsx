import type { Metadata } from 'next';

import SignInForm from '@/components/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function SignInPage() {
  return (
    <main aria-label="Sign in to GhostCart">
      <h1>Sign In</h1>
      <SignInForm />
    </main>
  );
}
