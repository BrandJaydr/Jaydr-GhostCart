'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ResetPasswordFormProps {
  initialToken?: string;
}

export default function ResetPasswordForm({ initialToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!initialToken) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">
            This reset link is missing its token. Request a new one below.
          </p>
        </div>
        <p className="text-sm text-neutral-500">
          <Link
            href="/forgot-password"
            className="font-semibold text-primary-600 hover:underline"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: initialToken, password }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(payload.error || 'Could not reset your password.');
        setIsLoading(false);
        return;
      }

      router.push('/sign-in?reset=1');
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
        label="New password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onValueChange={setPassword}
      />

      <Input
        label="Confirm new password"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Repeat your new password"
        value={confirm}
        onValueChange={setConfirm}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Resetting...' : 'Reset password'}
      </Button>
    </form>
  );
}