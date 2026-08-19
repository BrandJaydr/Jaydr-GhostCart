'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, FileText, TrendingUp, Upload, Boxes, Activity, ShieldAlert, PackageCheck, PackageX } from 'lucide-react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress } from '@heroui/react';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecentDeals } from '@/components/dashboard/RecentDeals';

/* Types mirrored from GET /api/dashboard/metrics */
interface ImportRow { date: string; total_imports: number; successful_imports: number; failed_imports: number; success_rate_percent: number; }
interface ListingStateRow { state: string; count: number; percentage: number; }
interface JobFailureRow { type: string; error_category: string; failure_count: number; percentage: number; }
interface MarginAnalysis {
  total_listings: number; listings_with_margin: number; average_margin_percent: number;
  min_margin_percent: number; max_margin_percent: number;
  low_margin_count: number; medium_margin_count: number; high_margin_count: number;
}
interface DashboardMetrics {
  imports: ImportRow[];
  listingStates: ListingStateRow[];
  jobFailures: JobFailureRow[];
  marginAnalysis: MarginAnalysis | null;
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
function getListingStateColor(state: string): ChipColor {
  switch (state.toLowerCase()) {
    case 'active': case 'published': case 'submitted': return 'success';
    case 'processing': case 'queued': case 'ready_for_review': return 'warning';
    case 'failed': case 'error': return 'danger';
    default: return 'default';
  }
}

function avgSuccessRate(rows: ImportRow[]): number {
  if (!rows || rows.length === 0) return 0;
  return rows.reduce((s, r) => s + (r.success_rate_percent || 0), 0) / rows.length;
}

export default function DashboardClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/metrics');
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const data = await res.json();
      if (data.success) setMetrics(data.data);
      else throw new Error(data.error || 'Failed to fetch dashboard metrics');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (error) {
    return <ErrorState title="Error loading dashboard" message={error} onRetry={fetchMetrics} />;
  }

  const imports = metrics?.imports ?? [];
  const listingStates = metrics?.listingStates ?? [];
  const jobFailures = metrics?.jobFailures ?? [];
  const margin = metrics?.marginAnalysis ?? null;
  const totalImports = imports.reduce((s, r) => s + (r.total_imports || 0), 0);
  const totalListings = listingStates.reduce((s, r) => s + (r.count || 0), 0);
  const avgRate = avgSuccessRate(imports);
  const hasData = totalImports > 0 || totalListings > 0;

  if (!metrics || !hasData) {
    return (
      <EmptyState
        title="Welcome to GhostCart Command Center"
        description="Get started by importing your first product. Your operational metrics will appear here."
        action={
          <Link href="/import" className="inline-flex items-center justify-center rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            <Upload />
            <span className="ml-2">Import Product</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6" aria-label="Command Center">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Imports" value={totalImports.toLocaleString()} icon={<Package className="h-5 w-5" />} tone="info" hint={imports.length ? imports.length + ' day window' : 'No imports yet'} />
        <StatCard label="Import Success" value={avgRate.toFixed(1) + '%'} icon={<TrendingUp className="h-5 w-5" />} tone={avgRate >= 80 ? 'success' : avgRate >= 60 ? 'warning' : 'danger'} hint="Avg over window" />
        <StatCard label="Listings" value={totalListings.toLocaleString()} icon={<FileText className="h-5 w-5" />} tone="neutral" hint={listingStates.length + ' states tracked'} />
        <StatCard label="Avg Margin" value={margin ? margin.average_margin_percent.toFixed(1) + '%' : '--'} icon={<Boxes className="h-5 w-5" />} tone={margin && margin.average_margin_percent >= 20 ? 'success' : margin && margin.average_margin_percent >= 10 ? 'warning' : 'neutral'} hint={margin ? margin.listings_with_margin + '/' + margin.total_listings + ' priced' : 'Not available'} />
      </div>      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col items-start px-6 pb-0 pt-6">
              <h3 className="text-lg font-semibold text-foreground">Margin Analysis</h3>
              <p className="text-sm text-muted-foreground">Distribution across your priced catalog</p>
            </CardHeader>
            <CardBody className="px-6 py-4">
              {margin ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className="text-lg font-semibold text-foreground">{margin.min_margin_percent.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Average</p>
                      <p className="text-lg font-semibold text-success">{margin.average_margin_percent.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className="text-lg font-semibold text-foreground">{margin.max_margin_percent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <MarginBand label="Low (under 10%)" value={margin.low_margin_count} total={margin.listings_with_margin} toneClass="bg-warning" />
                  <MarginBand label="Medium (10-20%)" value={margin.medium_margin_count} total={margin.listings_with_margin} toneClass="bg-primary-500" />
                  <MarginBand label="High (over 20%)" value={margin.high_margin_count} total={margin.listings_with_margin} toneClass="bg-success" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No margin data available yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col items-start px-6 pb-0 pt-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ShieldAlert className="h-5 w-5 text-error" />
                Recent Failures
              </h3>
              <p className="text-sm text-muted-foreground">Latest job failure alerts</p>
            </CardHeader>
            <CardBody className="max-h-[300px] overflow-y-auto px-6 py-4">
              {jobFailures.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {jobFailures.map((failure, index) => (
                    <li key={failure.type + '-' + index} className="flex items-center gap-3 rounded-md border border-border p-3">
                      <FailureIcon category={failure.error_category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{failure.type || 'unknown'}</p>
                        <p className="truncate text-xs text-muted-foreground">{failure.error_category || 'uncategorised'}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{failure.failure_count}x</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Activity className="mb-2 h-8 w-8 text-neutral-300" />
                  <p className="text-sm text-muted-foreground">All systems operational, no recent failures.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col items-start px-6 pb-0 pt-6">
            <h3 className="text-lg font-semibold text-foreground">Listing States</h3>
            <p className="text-sm text-muted-foreground">Breakdown of current listing statuses</p>
          </CardHeader>
          <CardBody className="px-6 py-4">
            {listingStates.length > 0 ? (
              <Table aria-label="Listing States Table">
                <TableHeader>
                  <TableColumn>STATE</TableColumn>
                  <TableColumn align="center">COUNT</TableColumn>
                  <TableColumn align="end">PERCENTAGE</TableColumn>
                </TableHeader>
                <TableBody>
                  {listingStates.map((stateInfo) => (
                    <TableRow key={stateInfo.state}>
                      <TableCell>
                        <Chip color={getListingStateColor(stateInfo.state)} size="sm" variant="flat">{stateInfo.state}</Chip>
                      </TableCell>
                      <TableCell><span className="block text-center">{stateInfo.count}</span></TableCell>
                      <TableCell><span className="block text-right">{stateInfo.percentage.toFixed(1)}%</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No listing state data available.</p>
            )}
          </CardBody>
        </Card>
        
        <RecentDeals />
      </div>
    </div>
  );
}

function MarginBand({ label, value, total, toneClass }: { label: string; value: number; total: number; toneClass: string }) {
  const safeTotal = total > 0 ? total : 1;
  const pct = Math.min(100, (value / safeTotal) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <Progress aria-label={label} value={pct} size="sm" className="flex-1" classNames={{ indicator: toneClass }} />
      <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function FailureIcon({ category }: { category?: string }) {
  const c = (category || '').toLowerCase();
  const cls = c.includes('adapter') || c.includes('network')
    ? 'bg-info/10 text-info'
    : c.includes('auth') || c.includes('rate')
      ? 'bg-warning/10 text-warning'
      : 'bg-error/10 text-error';
  return (
    <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' + cls} aria-hidden="true">
      {c.includes('adapter') || c.includes('network')
        ? <PackageX className="h-4 w-4" />
        : <PackageCheck className="h-4 w-4" />}
    </span>
  );
}