import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Jobs',
};

export default function JobsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Jobs" subtitle="Background import and processing jobs" />
      <div className="mt-6">
        <EmptyState
          title="No jobs yet"
          description="Product imports and refreshes run as background jobs and will be tracked here."
          action={
            <Link
              href="/import"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600"
            >
              Start an import
            </Link>
          }
        />
      </div>
    </div>
  );
}
