'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Upload,
  Package,
  FileText,
  Clock,
  DollarSign,
  Settings,
  Store,
  Factory,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Quick Actions' | 'Settings';
  icon: React.ReactNode;
  perform: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'View overall metrics and recent activity',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-5 h-5" />,
      perform: () => {
        router.push('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-import',
      title: 'Import Catalog',
      subtitle: 'Import products via URL, CSV, or Mock data',
      category: 'Navigation',
      icon: <Upload className="w-5 h-5" />,
      perform: () => {
        router.push('/import');
        onClose();
      },
    },
    {
      id: 'nav-products',
      title: 'Products',
      subtitle: 'Manage normalized supplier catalog',
      category: 'Navigation',
      icon: <Package className="w-5 h-5" />,
      perform: () => {
        router.push('/products');
        onClose();
      },
    },
    {
      id: 'nav-listings',
      title: 'Marketplace Listings',
      subtitle: 'View active, draft, and pending listings',
      category: 'Navigation',
      icon: <FileText className="w-5 h-5" />,
      perform: () => {
        router.push('/listings');
        onClose();
      },
    },
    {
      id: 'nav-jobs',
      title: 'Job Activity',
      subtitle: 'Monitor BullMQ worker queues and background tasks',
      category: 'Navigation',
      icon: <Clock className="w-5 h-5" />,
      perform: () => {
        router.push('/jobs');
        onClose();
      },
    },
    {
      id: 'nav-repricing',
      title: 'Repricing Engine',
      subtitle: 'Review repricing rules and suggestions',
      category: 'Navigation',
      icon: <DollarSign className="w-5 h-5" />,
      perform: () => {
        router.push('/repricing');
        onClose();
      },
    },
    // Quick Actions
    {
      id: 'act-import-url',
      title: 'Quick Import Product',
      subtitle: 'Paste a supplier product link to analyze',
      category: 'Quick Actions',
      icon: <Sparkles className="w-5 h-5 text-primary-500" />,
      perform: () => {
        router.push('/import');
        onClose();
      },
    },
    {
      id: 'act-view-failures',
      title: 'Inspect Job Failures',
      subtitle: 'Filter and inspect failed worker jobs',
      category: 'Quick Actions',
      icon: <Clock className="w-5 h-5 text-danger" />,
      perform: () => {
        router.push('/jobs');
        onClose();
      },
    },
    // Settings
    {
      id: 'set-general',
      title: 'General Settings',
      subtitle: 'Configure account and store preferences',
      category: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      perform: () => {
        router.push('/settings/general');
        onClose();
      },
    },
    {
      id: 'set-marketplaces',
      title: 'Marketplace Integrations',
      subtitle: 'Manage eBay and sales channel connections',
      category: 'Settings',
      icon: <Store className="w-5 h-5" />,
      perform: () => {
        router.push('/settings/marketplaces');
        onClose();
      },
    },
    {
      id: 'set-suppliers',
      title: 'Supplier Adapters',
      subtitle: 'Configure supplier feeds and stock syncing',
      category: 'Settings',
      icon: <Factory className="w-5 h-5" />,
      perform: () => {
        router.push('/settings/suppliers');
        onClose();
      },
    },
    {
      id: 'set-logout',
      title: 'Sign Out',
      subtitle: 'End your current session',
      category: 'Settings',
      icon: <LogOut className="w-5 h-5 text-danger" />,
      perform: () => {
        router.push('/sign-out');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle?.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Adjust selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered commands by category
  const categories = Array.from(new Set(filteredCommands.map((cmd) => cmd.category)));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[12vh] sm:pt-[16vh] p-4 transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-foreground animate-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
          />
          <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-border rounded-md text-xs text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No results found for &ldquo;<span className="font-semibold text-foreground">{query}</span>&rdquo;
            </div>
          ) : (
            categories.map((category) => {
              const itemsInCategory = filteredCommands.filter((cmd) => cmd.category === category);
              return (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="px-3 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1 mt-1">
                    {itemsInCategory.map((item) => {
                      const itemIndex = filteredCommands.indexOf(item);
                      const isSelected = itemIndex === selectedIndex;

                      return (
                        <button
                          key={item.id}
                          data-index={itemIndex}
                          type="button"
                          onClick={() => item.perform()}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-primary-500 text-white font-medium shadow-sm'
                              : 'text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={isSelected ? 'text-white' : 'text-muted-foreground'}>
                              {item.icon}
                            </span>
                            <div className="truncate">
                              <p className="text-sm font-medium leading-none">{item.title}</p>
                              {item.subtitle && (
                                <p
                                  className={`text-xs mt-1 truncate ${
                                    isSelected ? 'text-white/80' : 'text-muted-foreground'
                                  }`}
                                >
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <ArrowRight
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isSelected ? 'text-white translate-x-0.5' : 'text-muted-foreground/40 opacity-0'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded font-mono">ESC</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
