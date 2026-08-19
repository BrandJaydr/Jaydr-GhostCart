/**
 * Account Commands
 *   ghostcart account usage [--json]
 *   ghostcart account alerts [--json]
 *   ghostcart account alerts ack <id>
 */

import { Command } from 'commander';
import { api, ApiError } from '../api-client.js';
import { color, sym, sectionHeader } from '../ui/theme.js';
import { renderTable, truncate } from '../ui/table.js';
import { spinner } from '../ui/spinner.js';

interface DashboardMetrics {
  total_products?: number;
  products_needing_review?: number;
  total_listings?: number;
  listings_by_state?: Record<string, number>;
  jobs_failed_24h?: number;
  jobs_completed_24h?: number;
}

interface Alert {
  id: string;
  severity: string;
  message: string;
  created_at: string;
  acked_at: string | null;
}

export function registerAccountCommands(program: Command): void {
  const account = program
    .command('account')
    .description('Account usage and alerts');

  account
    .command('usage')
    .description('Show account usage summary')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      const stop = spinner('Loading usage...');
      try {
        const res = await api.get<DashboardMetrics>('/api/dashboard/metrics');
        stop('Done');

        const m = res.data!;
        if (opts.json) { console.log(JSON.stringify(m)); return; }

        console.log(sectionHeader('Account Usage'));

        // Products
        console.log(`  ${color.header('Products')}`);
        console.log(`    ${sym.bullet} Total:          ${color.bold(String(m.total_products ?? 0))}`);
        console.log(`    ${sym.bullet} Needs review:   ${m.products_needing_review ? color.warning(String(m.products_needing_review)) : color.muted('0')}`);

        // Listings
        console.log('');
        console.log(`  ${color.header('Listings')}`);
        console.log(`    ${sym.bullet} Total:          ${color.bold(String(m.total_listings ?? 0))}`);
        if (m.listings_by_state) {
          for (const [state, count] of Object.entries(m.listings_by_state)) {
            if (count > 0) {
              console.log(`    ${sym.bullet} ${state.padEnd(18)}: ${count}`);
            }
          }
        }

        // Jobs
        console.log('');
        console.log(`  ${color.header('Jobs (last 24h)')}`);
        console.log(`    ${sym.bullet} Completed:      ${color.success(String(m.jobs_completed_24h ?? 0))}`);
        if ((m.jobs_failed_24h ?? 0) > 0) {
          console.log(`    ${sym.bullet} Failed:         ${color.error(String(m.jobs_failed_24h))}`);
          console.log(`    ${sym.arrow} ${color.muted('View failures:')} ghostcart jobs list --status failed`);
        } else {
          console.log(`    ${sym.bullet} Failed:         ${color.muted('0')}`);
        }
        console.log('');
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  // ── alerts sub-command ──────────────────────────────────────────────────────
  const alerts = account
    .command('alerts')
    .description('View and acknowledge system alerts');

  alerts
    .command('list')
    .description('List unacknowledged alerts')
    .option('--all', 'Include acknowledged alerts')
    .option('--json', 'Output as JSON')
    .action(async (opts: { all?: boolean; json?: boolean }) => {
      const stop = spinner('Loading alerts...');
      try {
        const query = opts.all ? '' : '?unacked=true';
        const res = await api.get<Alert[]>(`/api/alerts${query}`);
        stop('Done');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        const items = res.data ?? [];
        console.log(sectionHeader(`Alerts (${items.length})`));

        if (!items.length) {
          console.log(`  ${sym.ok} No active alerts.\n`);
          return;
        }

        renderTable(
          ['ID', 'Severity', 'Message', 'Created'],
          items.map((a) => [
            truncate(a.id, 8),
            severityBadge(a.severity),
            truncate(a.message, 48),
            new Date(a.created_at).toLocaleDateString(),
          ]),
        );

        console.log(`  ${sym.arrow} ${color.muted('Acknowledge:')} ghostcart account alerts ack <id>\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  alerts
    .command('ack <id>')
    .description('Acknowledge an alert')
    .action(async (id: string) => {
      const stop = spinner('Acknowledging alert...');
      try {
        await api.post(`/api/alerts/${id}/ack`, {});
        stop(`Alert ${id} acknowledged`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  // Default action for `ghostcart account alerts` (no subcommand) → list
  alerts.action(async () => {
    const stop = spinner('Loading alerts...');
    try {
      const res = await api.get<Alert[]>('/api/alerts?unacked=true');
      stop('Done');
      const items = res.data ?? [];
      console.log(sectionHeader(`Alerts (${items.length})`));
      if (!items.length) { console.log(`  ${sym.ok} No active alerts.\n`); return; }
      renderTable(
        ['ID', 'Severity', 'Message', 'Created'],
        items.map((a) => [
          truncate(a.id, 8), severityBadge(a.severity),
          truncate(a.message, 48), new Date(a.created_at).toLocaleDateString(),
        ]),
      );
      console.log(`  ${sym.arrow} ${color.muted('Acknowledge:')} ghostcart account alerts ack <id>\n`);
    } catch (err) {
      stop('Failed', true);
      handleApiError(err);
    }
  });
}

function severityBadge(severity: string): string {
  const map: Record<string, string> = {
    critical: color.error('✗ critical'),
    error:    color.error('✗ error'),
    warning:  color.warning('⚠ warning'),
    info:     color.info('i info'),
  };
  return map[severity] ?? color.muted(severity);
}

function handleApiError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(`  ${color.error('✗')} ${err.message} (HTTP ${err.statusCode})\n`);
  } else {
    console.error(`  ${color.error('✗')} ${String(err)}\n`);
  }
  process.exit(1);
}
