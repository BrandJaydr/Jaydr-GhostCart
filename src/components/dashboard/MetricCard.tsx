"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="group relative bg-white dark:bg-slate-950 border border-border rounded-2xl p-5 hover:border-primary-500/50 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-sm"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: "both" }}
    >
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">
            {title}
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors duration-300">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary-500 transition-colors duration-300" />
          </div>
        </div>

        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-foreground tracking-tight">
            {value}
          </span>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium mb-1",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-error",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUp className="w-4 h-4" />}
            {changeType === "negative" && (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
