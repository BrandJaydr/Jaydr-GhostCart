import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Repricing',
};

export default function RepricingPage() {
  return (
    <div className="p-6">
      <PageHeader title="Repricing" subtitle="Automatic price optimization rules" />
      <div className="mt-6">
        <EmptyState
          title="Repricing not configured yet"
          description="Set up repricing rules to automatically adjust listing prices based on cost and margin targets."
        />
      </div>
    </div>
  );
}
