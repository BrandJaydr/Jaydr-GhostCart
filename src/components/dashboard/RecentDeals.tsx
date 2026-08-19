"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export const mockDeals = [
  {
    company: "Acme Corp",
    value: "$125,000",
    status: "won",
    date: "2 hours ago",
    rep: "Sarah Chen",
  },
  {
    company: "TechStart Inc",
    value: "$89,500",
    status: "pending",
    date: "5 hours ago",
    rep: "Mike Johnson",
  },
  {
    company: "GlobalFin",
    value: "$245,000",
    status: "pending",
    date: "1 day ago",
    rep: "Emily Davis",
  },
  {
    company: "DataSync Solutions",
    value: "$67,800",
    status: "lost",
    date: "2 days ago",
    rep: "James Wilson",
  },
  {
    company: "CloudBase Ltd",
    value: "$178,000",
    status: "won",
    date: "3 days ago",
    rep: "Sarah Chen",
  },
];

const statusConfig = {
  won: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Won",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Pending",
  },
  lost: {
    icon: XCircle,
    color: "text-error",
    bg: "bg-error/10",
    label: "Lost",
  },
};

export function RecentDeals() {
  return (
    <div className="bg-white dark:bg-slate-950 border border-border rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Deals</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Latest activity across accounts</p>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors group">
          View all
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      <div className="space-y-4">
        {mockDeals.map((deal, index) => {
          const status = statusConfig[deal.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <div
              key={deal.company}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-left-2"
              style={{ animationDelay: `${(index + 3) * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base font-bold text-muted-foreground group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-all duration-200">
                  {deal.company.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{deal.company}</p>
                  <p className="text-sm text-muted-foreground">{deal.rep} • {deal.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base font-bold text-foreground">{deal.value}</span>
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold", status.bg, status.color)}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
