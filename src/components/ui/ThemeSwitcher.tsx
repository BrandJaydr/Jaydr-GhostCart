'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Button,
  Switch,
} from '@heroui/react';
import { ChevronDown, Check } from 'lucide-react';

// ─── Custom Sun & Moon SVG Icons from HeroUI Specification ───────────────────
export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
      fill="currentColor"
    />
  </svg>
);

export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
type BaseTheme = 'default' | 'cream-burgundy' | 'cherry-blossom';
type Mode = 'light' | 'dark';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseTheme(theme: string | undefined): { base: BaseTheme; mode: Mode } {
  switch (theme) {
    case 'dark':                       return { base: 'default',        mode: 'dark' };
    case 'warm-cream-burgundy-2':      return { base: 'cream-burgundy', mode: 'light' };
    case 'warm-cream-burgundy-2-dark': return { base: 'cream-burgundy', mode: 'dark' };
    case 'cherry-blossom':             return { base: 'cherry-blossom', mode: 'light' };
    case 'cherry-blossom-dark':        return { base: 'cherry-blossom', mode: 'dark' };
    default:                           return { base: 'default',        mode: 'light' };
  }
}

function buildTheme(base: BaseTheme, mode: Mode): string {
  if (base === 'cream-burgundy') {
    return mode === 'dark' ? 'warm-cream-burgundy-2-dark' : 'warm-cream-burgundy-2';
  }
  if (base === 'cherry-blossom') {
    return mode === 'dark' ? 'cherry-blossom-dark' : 'cherry-blossom';
  }
  return mode; // 'light' | 'dark'
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const { base, mode } = mounted
    ? parseTheme(theme)
    : { base: 'default' as BaseTheme, mode: 'light' as Mode };

  const handleBaseChange = (newBase: BaseTheme) => setTheme(buildTheme(newBase, mode));
  const handleModeToggle = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setTheme(buildTheme(base, newMode));
  };

  const triggerLabel = mounted
    ? (base === 'cream-burgundy' ? 'Cream & Burgundy' : base === 'cherry-blossom' ? 'Cherry Blossom' : 'Default')
    : 'Theme';

  return (
    <Dropdown
      placement="bottom-end"
      classNames={{
        content: "p-1.5 border border-border bg-surface shadow-2xl rounded-2xl min-w-[230px]",
      }}
    >
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Theme selector"
          className="gc-trigger-bordered min-w-[160px] group cursor-pointer"
        >
          <span className="flex-1 text-left text-sm truncate">{triggerLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Theme selection"
        variant="flat"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={new Set([base])}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          if (selected === 'default' || selected === 'cream-burgundy' || selected === 'cherry-blossom') {
            handleBaseChange(selected);
          }
        }}
        className="w-full"
      >
        <DropdownSection title="Theme" showDivider>
          <DropdownItem
            key="default"
            color="primary"
            className={base === 'default' ? 'bg-primary text-white font-semibold data-[hover=true]:bg-primary data-[hover=true]:text-white' : 'text-foreground'}
          >
            Default
          </DropdownItem>
          <DropdownItem
            key="cream-burgundy"
            color="primary"
            className={base === 'cream-burgundy' ? 'bg-primary text-white font-semibold data-[hover=true]:bg-primary data-[hover=true]:text-white' : 'text-foreground'}
          >
            Cream & Burgundy
          </DropdownItem>
          <DropdownItem
            key="cherry-blossom"
            color="primary"
            className={base === 'cherry-blossom' ? 'bg-primary text-white font-semibold data-[hover=true]:bg-primary data-[hover=true]:text-white' : 'text-foreground'}
          >
            Cherry Blossom
          </DropdownItem>
        </DropdownSection>

        <DropdownSection>
          <DropdownItem
            key="mode-toggle"
            closeOnSelect={false}
            isReadOnly
            textValue="Theme Mode Toggle"
            className="cursor-default py-2 hover:!bg-transparent focus:!bg-transparent data-[hover=true]:!bg-transparent"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-foreground">
                {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <Switch
                size="sm"
                color="primary"
                isSelected={mode === 'dark'}
                onValueChange={handleModeToggle}
                startContent={<SunIcon className="w-3.5 h-3.5 text-amber-500" />}
                endContent={<MoonIcon className="w-3.5 h-3.5 text-white" />}
                classNames={{
                  wrapper: "bg-[#e0dbd8] dark:bg-[#3a0f17] data-[selected=true]:!bg-[#55121e] border border-[#d1a9b0] transition-colors",
                  thumb: "bg-white shadow-md",
                }}
                aria-label="Toggle dark mode"
              />
            </div>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
