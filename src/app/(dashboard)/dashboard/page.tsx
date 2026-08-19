import type { Metadata } from 'next';
import DashboardClient from './client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Dashboard | GhostCart',
};

export default function DashboardPage() {
  return (
    <main aria-label="Dashboard" className="flex flex-col gap-6 p-6">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Command Center', href: '' },
        ]}
      />
      <DashboardClient />
    </main>
  );
}