import type { Metadata } from 'next';
import SignupForm from '@/components/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up | GhostCart',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">
          Create your account
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Start importing and listing with GhostCart
        </p>

        <SignupForm />
      </div>
    </div>
  );
}