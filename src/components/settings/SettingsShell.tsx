'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { User, Shield, Terminal, AlertTriangle } from 'lucide-react';

export interface SettingsTab {
  id: string;
  label: string;
  icon: ReactNode;
  description: string;
}

const TABS: SettingsTab[] = [
  {
    id: 'account',
    label: 'Account',
    icon: <User className="w-4 h-4" />,
    description: 'Profile and display preferences',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="w-4 h-4" />,
    description: 'Password and session management',
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: <Terminal className="w-4 h-4" />,
    description: 'Debug tools and telemetry',
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Irreversible account actions',
  },
];

interface SettingsShellProps {
  children: ReactNode;
  activeTab: string;
}

export function SettingsShell({ children, activeTab }: SettingsShellProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, security, and workspace preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical Tab Nav */}
        <nav
          className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:w-52 flex-shrink-0 pb-2 md:pb-0"
          aria-label="Settings navigation"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/settings/general?tab=${tab.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap md:whitespace-normal border-2 ${
                  isActive
                    ? 'gc-sidebar-active'
                    : 'gc-sidebar-item'
                } ${tab.id === 'danger' && !isActive ? 'text-red-500/80 hover:text-red-600' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={
                    tab.id === 'danger' && !isActive ? 'text-red-500' : ''
                  }
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
