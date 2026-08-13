'use client';

import { useState } from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Menu, Search, Bell, User, LogOut, Settings } from 'lucide-react';

export interface TopNavProps {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export function TopNav({ onSidebarToggle }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Navbar
      isBordered
      className="bg-white h-16"
    >
      <NavbarContent>
        <NavbarBrand className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={onSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
              G
            </div>
            <span className="font-bold text-lg text-foreground">GhostCart</span>
          </div>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          variant="bordered"
          size="sm"
          className="max-w-md"
          startContent={<Search className="w-4 h-4 text-muted-foreground" />}
        />
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button isIconOnly variant="light" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="light">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  U
                </div>
                <span className="ml-2 text-sm font-medium">User</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile" href="/profile">
                <User className="w-4 h-4 mr-2" /> My Profile
              </DropdownItem>
              <DropdownItem key="settings" href="/settings/general">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownItem>
              <DropdownItem key="logout" href="/sign-out" className="text-danger">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
