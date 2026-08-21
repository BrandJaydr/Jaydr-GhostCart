import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Suppliers',
};

export default function SettingsSuppliersPage() {
  return (
    <div className="p-6">
      <PageHeader title="Suppliers" subtitle="Manage supplier connections" />
      <div className="mt-6">
        <EmptyState
          title="No suppliers connected"
          description="Connect suppliers to import product catalogs. Full supplier management arrives in a follow-up."
        />
      </div>
    </div>
  );
}
