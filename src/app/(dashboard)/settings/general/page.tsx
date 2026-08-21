import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsGeneralPage() {
  return (
    <div className="p-6">
      <PageHeader title="General Settings" subtitle="Workspace preferences" />
      <div className="mt-6">
        <EmptyState
          title="General settings coming soon"
          description="Workspace-wide preferences will be managed here."
        />
      </div>
    </div>
  );
}
