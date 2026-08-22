'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
      } else if (res?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
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
        label="Email address"
        type="email"
        required
        autoComplete="email"
        placeholder="dev@ghostcart.local"
        value={email}
        onValueChange={setEmail}
      />

      <Input
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Enter your password"
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
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/signup" className="font-semibold text-primary-600 hover:underline">
          Create account
        </Link>
        <Link href="/forgot-password" className="font-semibold text-primary-600 hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
