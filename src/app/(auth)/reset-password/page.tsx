import type { Metadata } from 'next';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | GhostCart',
};

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">
          Choose a new password
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Enter a new password for your account
        </p>

        <ResetPasswordForm initialToken={searchParams.token} />
      </div>
    </div>
  );
}