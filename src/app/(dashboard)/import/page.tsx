import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import ImportForm from '@/components/import/ImportForm';

export const metadata: Metadata = {
  title: 'Import Product | GhostCart',
};

export default function ImportPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Import Product"
        subtitle="Import products from suppliers to your catalog"
      />
      <div className="mt-6">
        <ImportForm />
      </div>
    </div>
  );
}
