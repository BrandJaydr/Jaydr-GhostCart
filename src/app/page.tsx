import { redirect } from 'next/navigation';

/**
 * Root page — immediately redirects to the dashboard.
 * Auth guard in (dashboard)/layout.tsx handles unauthenticated users → /sign-in.
 */
export default function RootPage() {
  redirect('/dashboard');
}
