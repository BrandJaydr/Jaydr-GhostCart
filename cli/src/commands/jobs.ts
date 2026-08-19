/**
 * Jobs Commands
 *   ghostcart jobs list [--status <status>] [--json]
 *   ghostcart jobs view <id> [--json]
 *   ghostcart jobs retry <id>
 *   ghostcart jobs kill <id>
 */

import { Command } from 'commander';
import { api, ApiError } from '../api-client.js';
import { color, sym, sectionHeader } from '../ui/theme.js';
import { renderTable, truncate } from '../ui/table.js';
import { spinner } from '../ui/spinner.js';

interface Job {
  id: string;
  type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
}

export function registerJobCommands(program: Command): void {
  const jobs = program
    .command('jobs')
    .description('Monitor and control background jobs');

  jobs
    .command('list')
    .description('List recent jobs')
    .option('--status <status>', 'Filter by status (pending, running, completed, failed)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { status?: string; json?: boolean }) => {
      const stop = spinner('Loading jobs...');
      try {
        const query = opts.status ? `?status=${opts.status}` : '';
        const res = await api.get<Job[]>(`/api/jobs/activity${query}`);
        stop('Done');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        const items = res.data ?? [];
        console.log(sectionHeader(`Jobs (${items.length} recent)`));

        renderTable(
          ['ID', 'Type', 'Status', 'Attempts', 'Created'],
          items.map((j) => [
            truncate(j.id, 8),
            j.type,
            jobStatusBadge(j.status),
            String(j.attempts),
            new Date(j.created_at).toLocaleDateString(),
          ]),
        );

        console.log(`  ${sym.arrow} ${color.muted('Retry failed:')} ghostcart jobs retry <id>`);
        console.log(`  ${sym.arrow} ${color.muted('Kill running:')} ghostcart jobs kill <id>\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  jobs
    .command('view <id>')
    .description('Show full job details')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      const stop = spinner('Loading job...');
      try {
        const res = await api.get<Job>(`/api/jobs/${id}`);
        stop('Done');

        const j = res.data!;
        if (opts.json) { console.log(JSON.stringify(j)); return; }

        console.log(sectionHeader('Job Details'));
        console.log(`  ${sym.bullet} ID:        ${color.muted(j.id)}`);
        console.log(`  ${sym.bullet} Type:      ${color.header(j.type)}`);
        console.log(`  ${sym.bullet} Status:    ${jobStatusBadge(j.status)}`);
        console.log(`  ${sym.bullet} Attempts:  ${j.attempts}`);
        console.log(`  ${sym.bullet} Created:   ${new Date(j.created_at).toLocaleString()}`);
        if (j.completed_at) {
          console.log(`  ${sym.bullet} Completed: ${new Date(j.completed_at).toLocaleString()}`);
        }
        if (j.last_error) {
          console.log('');
          console.log(`  ${color.error('Last Error:')}`);
          console.log(`  ${color.muted(j.last_error)}`);
        }
        console.log('');

        if (j.status === 'failed') {
          console.log(`  ${sym.arrow} ${color.muted('Retry:')} ghostcart jobs retry ${id}\n`);
        } else if (j.status === 'running' || j.status === 'pending') {
          console.log(`  ${sym.arrow} ${color.muted('Kill:')} ghostcart jobs kill ${id}\n`);
        }
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  jobs
    .command('retry <id>')
    .description('Retry a failed job')
    .action(async (id: string) => {
      const stop = spinner('Retrying job...');
      try {
        await api.post(`/api/jobs/${id}/retry`, {});
        stop(`Job ${id} queued for retry`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  jobs
    .command('kill <id>')
    .description('Kill a running job')
    .action(async (id: string) => {
      const stop = spinner('Killing job...');
      try {
        await api.post(`/api/jobs/kill`, { jobId: id });
        stop(`Job ${id} killed`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });
}

function jobStatusBadge(status: string): string {
  const map: Record<string, string> = {
    pending:   color.warning('⚠ pending'),
    running:   color.info('⟳ running'),
    completed: color.success('✓ completed'),
    failed:    color.error('✗ failed'),
  };
  return map[status] ?? color.muted(status);
}

function handleApiError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(`  ${color.error('✗')} ${err.message} (HTTP ${err.statusCode})\n`);
  } else {
    console.error(`  ${color.error('✗')} ${String(err)}\n`);
  }
  process.exit(1);
}
