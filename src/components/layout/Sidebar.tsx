'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, Button } from '@heroui/react';
import { Settings, Package, FileText, Clock, DollarSign, Store, Factory, LayoutDashboard, Upload, Menu, Sparkles } from 'lucide-react';

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
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const sections: SidebarSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Import', href: '/import', icon: <Upload className="w-5 h-5" /> },
        { label: 'Table Creator', href: '/products/editor', icon: <FileText className="w-5 h-5" /> },
        { label: 'Products', href: '/products', icon: <Package className="w-5 h-5" /> },
        { label: 'Listings', href: '/listings', icon: <FileText className="w-5 h-5" /> },
        { label: 'Media Studio', href: '/studio', icon: <Sparkles className="w-5 h-5" /> },
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
    <nav className="flex flex-col h-full bg-transparent">
      {/* Brand & Toggle */}
      <div className="p-4 flex items-center h-16 shrink-0 mt-4">
        <Button
          isIconOnly
          variant="light"
          onPress={onToggle}
          aria-label="Toggle sidebar"
          className="mr-2 text-foreground"
          radius="full"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {!isCollapsed && (
          <span className="font-bold text-lg text-foreground flex-shrink-0 tracking-tight">GhostCart</span>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 overflow-x-hidden">
        {sections.map((section) => (
          <div key={section.title} className="mb-8">
            {!isCollapsed && (
              <div className="px-6 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {section.title}
              </div>
            )}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                const linkContent = (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-4 mx-4 rounded-xl transition-all duration-300 ${
                      isCollapsed ? 'justify-center p-3' : 'px-4 py-3'
                    } ${
                      isActive
                        ? 'bg-primary-500 text-white font-medium shadow-md shadow-primary-500/20'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground hover:shadow-sm'
                    }`}
                    aria-label={item.label}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );

                return isCollapsed ? (
                  <Tooltip
                    key={item.href}
                    content={item.label}
                    placement="right"
                    showArrow={true}
                    offset={18}
                    classNames={{
                      content: "bg-primary-600 text-white border border-primary-700 shadow-lg text-xs rounded-lg px-3 py-1.5",
                    }}
                  >
                    {linkContent}
                  </Tooltip>
                ) : (
                  <div key={item.href}>{linkContent}</div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}