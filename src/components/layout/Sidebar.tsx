'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Package, FileText, Clock, DollarSign, Store, Factory, LayoutDashboard } from 'lucide-react';

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  isCollapsed?: boolean;
  sections?: SidebarSection[];
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const sections: SidebarSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Products', href: '/products', icon: <Package className="w-5 h-5" /> },
        { label: 'Listings', href: '/listings', icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Jobs', href: '/jobs', icon: <Clock className="w-5 h-5" /> },
        { label: 'Repricing', href: '/repricing', icon: <DollarSign className="w-5 h-5" /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'General', href: '/settings/general', icon: <Settings className="w-5 h-5" /> },
        { label: 'Marketplaces', href: '/settings/marketplaces', icon: <Store className="w-5 h-5" /> },
        { label: 'Suppliers', href: '/settings/suppliers', icon: <Factory className="w-5 h-5" /> },
      ],
    },
  ];

  return (
    <nav className="flex flex-col h-full bg-surface border-r border-border">
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
            G
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-foreground">GhostCart</span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            {!isCollapsed && (
              <div className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
                  }`}
                  aria-label={item.label}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
