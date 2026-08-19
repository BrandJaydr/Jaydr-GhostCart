'use client';

import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type StatCardTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  trend?: { label: string; direction: 'up' | 'down' | 'neutral' };
  hint?: string;
  loading?: boolean;
}

const toneClasses: Record<StatCardTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
  info: 'bg-primary-50 text-primary-600',
};

const trendClasses = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-muted-foreground',
};

/**
 * StatCard - reusable metric/stat presentation card.
 *
 * Owned GhostCart wrapper around HeroUI Card. Used by the Command Center
 * (Phase 2) and planned for Repricing, Performance Analytics, and
 * Research Engine dashboards in later phases.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
  trend,
  hint,
  loading = false,
}: StatCardProps) {
  const TrendIcon = trend
    ? trend.direction === 'up'
      ? ArrowUpRight
      : trend.direction === 'down'
        ? ArrowDownRight
        : Minus
    : null;

  return (
    <div
      className="group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-primary-500/50 transition-all duration-300 overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px]"
    >
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && (
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 group-hover:bg-primary-500/10 ${
                toneClasses[tone]
              }`}
              aria-hidden="true"
            >
              <div className="group-hover:text-primary-500 transition-colors duration-300">
                {icon}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" aria-hidden="true" />
          ) : (
            <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
          )}

          {(trend || hint) && (
            <div className="flex flex-wrap items-center gap-2 text-sm mt-1 font-medium">
              {trend && (
                <span className={`inline-flex items-center gap-1 ${trendClasses[trend.direction]}`}>
                  {TrendIcon && <TrendIcon className="h-4 w-4" aria-hidden="true" />}
                  {trend.label}
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}