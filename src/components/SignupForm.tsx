'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error || 'Could not create your account.');
        setIsLoading(false);
        return;
      }

      const signInRes = await signIn('credentials', { email, password, redirect: false });
      if (signInRes?.error) {
        router.push('/sign-in?created=1');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Input
        label="Full name"
        autoComplete="name"
        placeholder="Jane Doe"
        value={name}
        onValueChange={setName}
      />

      <Input
        label="Email address"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onValueChange={setEmail}
      />

      <Input
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onValueChange={setPassword}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-sm text-neutral-500 text-center">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}