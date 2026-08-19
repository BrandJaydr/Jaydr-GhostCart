'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { CommandPalette } from '@/components/ui/CommandPalette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background p-4 gap-6 overflow-hidden">
      {/* Sidebar - Floating Icons Container */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 flex-shrink-0 overflow-visible ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex-shrink-0 z-10 h-16 flex items-center">
          <TopNav
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        </header>
        <main className="flex-1 overflow-auto pb-6">{children}</main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </div>
  );
}
