'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Terminal,
  RefreshCw,
  Search,
  Pause,
  Play,
  Download,
  ChevronRight,
  ChevronDown,
  Globe,
  Zap,
  Bot,
  Shield,
  DollarSign,
  Layers,
  ArrowLeft,
} from 'lucide-react';

interface LogItem {
  id?: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  correlationId?: string;
  message: string;
  metadata?: unknown;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Telemetry', icon: Layers },
  { id: 'SCRAPER', label: 'Scraper Engine', icon: Globe },
  { id: 'HTTP', label: 'HTTP & Throttling', icon: RefreshCw },
  { id: 'WORKER', label: 'Queues & Workers', icon: Zap },
  { id: 'AI', label: 'AI Optimization', icon: Bot },
  { id: 'AUTH', label: 'Auth & RLS', icon: Shield },
  { id: 'REPRICING', label: 'Repricing & Margins', icon: DollarSign },
];

export default function DeveloperLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterCorrelationId, setFilterCorrelationId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'all') params.set('level', selectedLevel);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      if (filterCorrelationId) params.set('correlationId', filterCorrelationId);
      params.set('limit', '200');

      const res = await fetch(`/api/dev/logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.logs) {
          setLogs(json.data.logs);
        }
      }
    } catch {
      // Ignore network aborts in live mode
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedLevel, searchQuery, filterCorrelationId]);

  useEffect(() => {
    fetchLogs();

    if (isLive) {
      intervalRef.current = setInterval(fetchLogs, 2000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLogs, isLive]);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ghostcart-logs-${new Date().toISOString().slice(0, 19)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'warn':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'info':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'debug':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/settings/general"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to General Settings</span>
          </Link>
          <PageHeader
            title="Developer Telemetry Console"
            subtitle="Real-time structured logs, scraper diagnostics, and queue execution traces"
          />
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border hover:bg-surface'
            }`}
          >
            {isLive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Live Tailing (2s)' : 'Paused'}</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 bg-surface hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground text-xs transition-colors"
            title="Refresh logs now"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-surface hover:bg-muted border border-border rounded-lg text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-4 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Level Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2 border-t border-border">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search log message, category, metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['all', 'debug', 'info', 'warn', 'error'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                  selectedLevel === lvl
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground border border-border hover:text-foreground'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* CID Filter Reset */}
          {filterCorrelationId && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary">
              <span>CID: {filterCorrelationId.slice(0, 8)}...</span>
              <button
                onClick={() => setFilterCorrelationId(null)}
                className="hover:text-foreground"
                title="Clear CID filter"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Feed Container */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col font-mono text-xs">
        {/* Feed Header */}
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
          <div className="flex items-center gap-4">
            <span>TIMESTAMP</span>
            <span>LEVEL</span>
            <span>CATEGORY</span>
            <span>MESSAGE</span>
          </div>
          <span>{logs.length} EVENTS</span>
        </div>

        {/* Feed Body */}
        <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="font-sans font-medium">No telemetry events match your criteria.</p>
              <p className="text-xs text-muted-foreground/70 font-sans">
                Trigger a product import or catalog sync to generate diagnostic logs.
              </p>
            </div>
          ) : (
            logs.map((item, idx) => {
              const uniqueKey = item.id || `log-${idx}-${item.timestamp}`;
              const isExpanded = expandedLogId === uniqueKey;

              return (
                <div key={uniqueKey} className="hover:bg-muted/20 transition-colors">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : uniqueKey)}
                    className="p-3 flex items-start gap-3 cursor-pointer select-none"
                  >
                    <button className="text-muted-foreground hover:text-foreground mt-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {/* Timestamp */}
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {/* Level */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getLevelBadgeClass(
                        item.level,
                      )}`}
                    >
                      {item.level}
                    </span>

                    {/* Category */}
                    <span className="px-1.5 py-0.5 rounded bg-background border border-border text-foreground text-[10px] font-semibold">
                      {item.category}
                    </span>

                    {/* CID Tag (Clickable) */}
                    {item.correlationId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterCorrelationId(item.correlationId ?? null);
                        }}
                        className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                        title="Filter exclusively by this Correlation ID"
                      >
                        CID:{item.correlationId.slice(0, 6)}
                      </button>
                    )}

                    {/* Message */}
                    <span className="text-foreground flex-1 break-all font-sans text-xs">
                      {item.message}
                    </span>
                  </div>

                  {/* Expanded Metadata JSON Drawer */}
                  {isExpanded && item.metadata !== undefined && (
                    <div className="p-4 bg-background border-t border-border/80 mx-3 mb-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2 text-muted-foreground text-[11px] font-semibold">
                        <span>PAYLOAD & METADATA INSPECTOR</span>
                        <span>{item.correlationId ? `Correlation: ${item.correlationId}` : 'No CID'}</span>
                      </div>
                      <pre className="p-3 bg-surface border border-border rounded text-[11px] text-foreground overflow-x-auto">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
