'use client';

import { type Key } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Search, Bell, User, LogOut, Settings, Moon, Plus, Command, Menu } from 'lucide-react';

export interface TopNavProps {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  onOpenCommandPalette?: () => void;
}

export function TopNav({ isSidebarCollapsed: _isSidebarCollapsed, onSidebarToggle, onOpenCommandPalette }: TopNavProps) {
  const router = useRouter();

  const handleMenuAction = (key: Key) => {
    if (key === 'profile') router.push('/profile');
    else if (key === 'settings') router.push('/settings/general');
    else if (key === 'logout') void signOut({ callbackUrl: '/sign-in' });
  };

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
          className="w-full max-w-lg bg-surface hover:bg-surface-elevated border border-border shadow-sm rounded-full h-12 px-5 flex items-center justify-between text-muted-foreground transition-all duration-200 group text-left"
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
        <Button isIconOnly variant="light" radius="full" aria-label="Dark Mode">
          <Moon className="w-5 h-5 text-foreground" />
        </Button>
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

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button variant="light" radius="full" className="px-2 gap-3 h-12 flex items-center ml-2">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden border border-border">
                G
              </div>
              <span className="hidden sm:block text-sm font-semibold text-foreground">GhostCart</span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User menu" onAction={handleMenuAction}>
            <DropdownItem key="profile" startContent={<User className="w-4 h-4" />}>
              My Profile
            </DropdownItem>
            <DropdownItem key="settings" startContent={<Settings className="w-4 h-4" />}>
              Settings
            </DropdownItem>
            <DropdownItem key="logout" className="text-danger" startContent={<LogOut className="w-4 h-4" />}>
              Log out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}