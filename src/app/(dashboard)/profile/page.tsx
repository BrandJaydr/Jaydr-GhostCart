import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'My Profile',
};

export default function ProfilePage() {
  return (
    <div className="p-6">
      <PageHeader title="My Profile" subtitle="Manage your account details" />
      <div className="mt-6">
        <EmptyState
          title="Profile management coming soon"
          description="Account details and preferences will be editable here."
        />
      </div>
    </div>
  );
}
