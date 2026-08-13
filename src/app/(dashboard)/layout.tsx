import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/config';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/layout/ToastProvider';

export default async function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <ToastProvider>
      <AppShell>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
