'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PriceAnalytics, PriceHistoryPoint } from '@/lib/products/price-history';

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
  analytics: PriceAnalytics;
  title?: string;
  height?: number;
}

export function PriceHistoryChart({
  history,
  analytics,
  title = 'Price Fluctuation & History',
  height = 280,
}: PriceHistoryChartProps) {
  // Format history points for Recharts
  const chartData = history.map((point) => {
    const date = new Date(point.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      name: formattedDate,
      price: (point.newPriceCents / 100).toFixed(2),
      priceCents: point.newPriceCents,
      changePercent: point.changePercent,
      source: point.source,
    };
  });

  // Trend badge formatting
  const trendBadgeConfig = {
    stable: {
      label: 'Stable',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: '🟢',
    },
    rising: {
      label: 'Rising',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      icon: '📈',
    },
    falling: {
      label: 'Falling',
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: '📉',
    },
    volatile: {
      label: 'High Volatility',
      classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: '⚠️',
    },
  }[analytics.trend];

  return (
    <div className="rounded-xl border border-[#e0dbd8] bg-white p-6 shadow-sm dark:border-[#2a2624] dark:bg-[#181615]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#0d0d0d] dark:text-[#f3f1ef]">{title}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Supplier cost trends, volatility analysis, and pattern tracking over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${trendBadgeConfig.classes}`}
          >
            <span>{trendBadgeConfig.icon}</span>
            <span>{trendBadgeConfig.label}</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Volatility: {analytics.volatilityScore}/100
          </span>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-100 bg-[#fbfaf9] p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Current Cost</div>
          <div className="mt-0.5 text-base font-bold text-[#791228] dark:text-rose-400">
            ${(analytics.currentPriceCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-[#fbfaf9] p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Average Cost</div>
          <div className="mt-0.5 text-base font-bold text-neutral-900 dark:text-neutral-100">
            ${(analytics.averagePriceCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-[#fbfaf9] p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Historical Range</div>
          <div className="mt-0.5 text-base font-bold text-neutral-900 dark:text-neutral-100">
            ${(analytics.minPriceCents / 100).toFixed(2)} - ${(analytics.maxPriceCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-[#fbfaf9] p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Net Delta</div>
          <div
            className={`mt-0.5 text-base font-bold ${
              analytics.totalChangeCents > 0
                ? 'text-rose-600 dark:text-rose-400'
                : analytics.totalChangeCents < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-900 dark:text-neutral-100'
            }`}
          >
            {analytics.totalChangeCents > 0 ? '+' : ''}
            ${(analytics.totalChangeCents / 100).toFixed(2)} ({analytics.totalChangePercent > 0 ? '+' : ''}
            {analytics.totalChangePercent}%)
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mt-4" style={{ height: `${height}px`, width: '100%' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(224, 219, 216, 0.5)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#737373' }}
                axisLine={{ stroke: '#e0dbd8' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#737373' }}
                axisLine={{ stroke: '#e0dbd8' }}
                tickLine={false}
                tickFormatter={(val: number) => `$${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e0dbd8',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '12px',
                }}
                formatter={(value?: unknown) => [value !== undefined ? `$${value}` : '$0.00', 'Supplier Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#791228"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#791228', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#55121e', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-[#fbfaf9] text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40">
            No historical price change data recorded yet.
          </div>
        )}
      </div>

      {/* Detected Patterns Callout */}
      {analytics.detectedPatterns && analytics.detectedPatterns.length > 0 && (
        <div className="mt-4 rounded-lg border border-neutral-100 bg-[#f7f5f3] p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Identified Patterns & Fluctuation Behaviors
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {analytics.detectedPatterns.map((pattern, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
              >
                <span>🔍</span>
                <span>{pattern}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
