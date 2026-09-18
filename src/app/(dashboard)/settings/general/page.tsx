'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { AccountTab } from '@/components/settings/AccountTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { DeveloperTab } from '@/components/settings/DeveloperTab';
import { DangerZoneTab } from '@/components/settings/DangerZoneTab';
import { Loader2 } from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'account';

  const renderTab = () => {
    switch (tab) {
      case 'security':
        return <SecurityTab />;
      case 'developer':
        return <DeveloperTab />;
      case 'danger':
        return <DangerZoneTab />;
      case 'account':
      default:
        return <AccountTab />;
    }
  };

  return (
    <SettingsShell activeTab={tab}>
      {renderTab()}
    </SettingsShell>
  );
}

export default function SettingsGeneralPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
