'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ForgotPasswordResponse {
  ok?: boolean;
  devResetUrl?: string | null;
  error?: string;
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json()) as ForgotPasswordResponse;

      if (!res.ok) {
        setError(payload.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      setResult(payload);
      setIsLoading(false);
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link
            has been generated.
          </p>
        </div>
        {result.devResetUrl && (
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Dev-only reset link
            </p>
            <a
              href={result.devResetUrl}
              className="text-primary-600 text-sm break-all hover:underline"
            >
              {result.devResetUrl}
            </a>
          </div>
        )}
        <p className="text-sm text-neutral-500">
          <Link href="/sign-in" className="font-semibold text-primary-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onValueChange={setEmail}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send reset link'}
      </Button>

      <p className="text-sm text-neutral-500 text-center">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-semibold text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}