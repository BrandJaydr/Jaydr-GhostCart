'use client';

import { type Key } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, User } from '@heroui/react';
import { Search, Bell, LogOut, Settings, Plus, Command, Menu, Store, Factory, Clock } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

export interface TopNavProps {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopNav({ isSidebarCollapsed: _isSidebarCollapsed, onSidebarToggle, onOpenCommandPalette }: TopNavProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleMenuAction = (key: Key) => {
    if (key === 'profile') router.push('/profile');
    else if (key === 'settings') router.push('/settings/general');
    else if (key === 'marketplaces') router.push('/settings/marketplaces');
    else if (key === 'suppliers') router.push('/settings/suppliers');
    else if (key === 'jobs') router.push('/jobs');
    else if (key === 'logout') void signOut({ callbackUrl: '/sign-in' });
  };

  const userEmail = session?.user?.email || 'dev@ghostcart.local';
  const userName = session?.user?.name || (session?.user?.email ? session.user.email.split('@')[0] : 'Admin User');

  return (
    <div className="flex w-full justify-between items-center bg-transparent gap-4 h-full">
      {/* Search Island (Command Palette Trigger) */}
      <div className="flex-1 flex items-center gap-2">
        <Button
          isIconOnly
          variant="light"
          onPress={onSidebarToggle}
          radius="full"
          className="md:hidden text-foreground"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="gc-search-trigger group"
          aria-label="Open Command Palette"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm sm:text-base text-muted-foreground font-normal">Search or type a command...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-border rounded text-[11px] font-mono text-muted-foreground font-semibold flex items-center gap-0.5">
              <Command className="w-3 h-3" /> K
            </kbd>
          </div>
        </button>
      </div>

      {/* Floating Right Icons */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          isIconOnly
          variant="solid"
          className="bg-foreground text-background"
          radius="full"
          aria-label="Add New"
          onClick={() => router.push('/import')}
        >
          <Plus className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Button isIconOnly variant="light" radius="full" aria-label="Notifications">
            <Bell className="w-5 h-5 text-foreground" />
          </Button>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border border-background"></span>
        </div>

        <ThemeSwitcher />

        <Dropdown
          placement="bottom-end"
          classNames={{
            content: "p-1.5 border border-border bg-surface shadow-2xl rounded-2xl min-w-[240px]",
          }}
        >
          <DropdownTrigger>
            <User
              as="button"
              avatarProps={{
                isBordered: true,
                color: 'primary',
                src: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
                name: userName.substring(0, 2).toUpperCase(),
                showFallback: true,
                className: 'w-8 h-8 sm:w-9 sm:h-9 text-xs font-bold',
              }}
              className="transition-transform cursor-pointer ml-1 sm:ml-2 text-left"
              description={<span className="hidden lg:inline text-xs text-muted-foreground">{userEmail}</span>}
              name={<span className="hidden sm:inline font-semibold text-sm text-foreground capitalize">{userName}</span>}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat" onAction={handleMenuAction}>
            <DropdownItem key="profile" className="h-14 gap-2" textValue={`Signed in as ${userEmail}`}>
              <p className="font-semibold text-xs text-muted-foreground">Signed in as</p>
              <p className="font-bold text-sm text-foreground">{userEmail}</p>
            </DropdownItem>
            <DropdownItem key="settings" startContent={<Settings className="w-4 h-4" />}>
              My Settings
            </DropdownItem>
            <DropdownItem key="marketplaces" startContent={<Store className="w-4 h-4" />}>
              Marketplace Integrations
            </DropdownItem>
            <DropdownItem key="suppliers" startContent={<Factory className="w-4 h-4" />}>
              Supplier Feeds
            </DropdownItem>
            <DropdownItem key="jobs" startContent={<Clock className="w-4 h-4" />}>
              Job Activity & Queues
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              className="text-danger"
              startContent={<LogOut className="w-4 h-4" />}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}