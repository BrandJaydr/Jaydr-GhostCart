'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button
} from '@heroui/react';
import { Palette, Sun, Moon, Sparkles } from 'lucide-react';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch by waiting until mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        variant="bordered" 
        size="sm" 
        className="border-[#e0dbd8] text-[#0d0d0d] font-semibold h-9 rounded-lg"
        isIconOnly
      >
        <Palette className="w-4 h-4 text-[#6b7280]" />
      </Button>
    );
  }

  const getThemeIcon = (themeName: string | undefined) => {
    switch (themeName) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'warm-cream-burgundy-2':
        return <Sparkles className="w-4 h-4 text-[#791228]" />;
      default:
        return <Palette className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getThemeLabel = (themeName: string | undefined) => {
    switch (themeName) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'warm-cream-burgundy-2':
        return 'Cream & Burgundy';
      default:
        return 'System';
    }
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          variant="bordered"
          size="sm"
          className="border-[#e0dbd8] hover:border-[#791228]/50 text-[#0d0d0d] font-semibold h-9 rounded-lg flex items-center gap-1.5 min-w-[140px]"
          startContent={getThemeIcon(theme)}
        >
          <span>{getThemeLabel(theme)}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Theme Selection Options"
        variant="flat"
        onAction={(key) => setTheme(key as string)}
        classNames={{
          base: "border border-[#e0dbd8] rounded-xl shadow-md p-1 bg-white",
          list: "gap-1",
        }}
      >
        <DropdownItem
          key="warm-cream-burgundy-2"
          startContent={<Sparkles className="w-4 h-4 text-[#791228]" />}
          className="rounded-lg text-xs"
        >
          Cream & Burgundy
        </DropdownItem>
        <DropdownItem
          key="light"
          startContent={<Sun className="w-4 h-4 text-amber-500" />}
          className="rounded-lg text-xs"
        >
          Light Mode
        </DropdownItem>
        <DropdownItem
          key="dark"
          startContent={<Moon className="w-4 h-4 text-indigo-400" />}
          className="rounded-lg text-xs"
        >
          Dark Mode
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
