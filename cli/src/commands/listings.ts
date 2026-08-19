/**
 * Listings Commands
 *   ghostcart listings list [--state <state>] [--json]
 *   ghostcart listings view <id> [--json] [--web]
 *   ghostcart listings submit <id>
 *   ghostcart listings state <id> <new-state>
 */

import { Command } from 'commander';
import { api, ApiError } from '../api-client.js';
import { loadConfig } from '../config.js';
import { color, sym, sectionHeader, stateColor, webLink } from '../ui/theme.js';
import { renderTable, truncate } from '../ui/table.js';
import { spinner } from '../ui/spinner.js';

const VALID_STATES = [
  'draft', 'ready_for_review', 'queued', 'submitted', 'published', 'failed',
];

interface ListingDraft {
  id: string;
  product_id: string;
  marketplace: string;
  state: string;
  title: string | null;
  list_price_cents: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  last_error?: string | null;
}

export function registerListingCommands(program: Command): void {
  const listings = program
    .command('listings')
    .description('Manage listing drafts');

  listings
    .command('list')
    .description('List all listing drafts')
    .option('--state <state>', `Filter by state (${VALID_STATES.join(', ')})`)
    .option('--json', 'Output as JSON')
    .action(async (opts: { state?: string; json?: boolean }) => {
      const stop = spinner('Loading listings...');
      try {
        const query = opts.state ? `?state=${opts.state}` : '';
        const res = await api.get<ListingDraft[]>(`/api/listings${query}`);
        stop('Done');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        const items = res.data ?? [];
        console.log(sectionHeader(`Listing Drafts (${items.length} total)`));

        renderTable(
          ['ID', 'Title', 'State', 'Marketplace', 'Price', 'Updated'],
          items.map((l) => [
            truncate(l.id, 8),
            truncate(l.title ?? '(untitled)', 32),
            stateColor(l.state),
            l.marketplace,
            l.list_price_cents != null
              ? `${l.currency} ${(l.list_price_cents / 100).toFixed(2)}`
              : color.muted('—'),
            new Date(l.updated_at).toLocaleDateString(),
          ]),
        );

        console.log(`  ${sym.arrow} ${color.muted('View a listing:')} ghostcart listings view <id>`);
        console.log(`  ${sym.arrow} ${color.muted('Submit to eBay:')} ghostcart listings submit <id>\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  listings
    .command('view <id>')
    .description('Show full listing draft details')
    .option('--json', 'Output as JSON')
    .option('--web', 'Open in browser instead')
    .action(async (id: string, opts: { json?: boolean; web?: boolean }) => {
      const cfg = loadConfig();

      if (opts.web) {
        const url = `${cfg.baseUrl}/dashboard/listings/${id}`;
        console.log('\n' + webLink(url) + '\n');
        return;
      }

      const stop = spinner('Loading listing...');
      try {
        const res = await api.get<ListingDraft & {
          description?: string;
          attributes?: unknown;
        }>(`/api/listings/${id}`);
        stop('Done');

        const l = res.data!;
        if (opts.json) { console.log(JSON.stringify(l)); return; }

        console.log(sectionHeader('Listing Draft'));
        console.log(`  ${sym.bullet} ID:          ${color.muted(l.id)}`);
        console.log(`  ${sym.bullet} Title:       ${color.bold(l.title ?? '(untitled)')}`);
        console.log(`  ${sym.bullet} State:       ${stateColor(l.state)}`);
        console.log(`  ${sym.bullet} Marketplace: ${l.marketplace}`);
        if (l.list_price_cents != null) {
          console.log(`  ${sym.bullet} Price:       ${color.success(`${l.currency} ${(l.list_price_cents / 100).toFixed(2)}`)}`);
        }
        console.log(`  ${sym.bullet} Created:     ${new Date(l.created_at).toLocaleString()}`);
        console.log(`  ${sym.bullet} Updated:     ${new Date(l.updated_at).toLocaleString()}`);
        if (l.last_error) {
          console.log(`  ${sym.bullet} Last error:  ${color.error(l.last_error)}`);
        }
        console.log('');

        // Context-aware action suggestions
        if (l.state === 'draft') {
          console.log(`  ${sym.arrow} ${color.muted('Edit in browser:')} ghostcart listings view ${id} --web`);
          console.log(`  ${sym.arrow} ${color.muted('Mark ready:')} ghostcart listings state ${id} ready_for_review`);
        } else if (l.state === 'ready_for_review') {
          console.log(`  ${sym.arrow} ${color.muted('Submit to eBay:')} ghostcart listings submit ${id}`);
        } else if (l.state === 'failed') {
          console.log(`  ${sym.arrow} ${color.muted('Retry job:')} ghostcart jobs list`);
        }

        console.log(webLink(`${cfg.baseUrl}/dashboard/listings/${id}`));
        console.log('');
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  listings
    .command('submit <id>')
    .description('Submit a listing draft to eBay')
    .option('--json', 'Output as JSON')
    .action(async (id: string, opts: { json?: boolean }) => {
      const stop = spinner('Submitting to eBay...');
      try {
        const res = await api.post<{ jobId: string; message: string }>(
          `/api/ebay/submit`,
          { draftId: id },
        );
        stop('Submitted');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        console.log(`  ${sym.bullet} Job ID: ${color.brand(res.data?.jobId ?? '—')}`);
        console.log(`  ${sym.arrow} ${color.muted('Track progress:')} ghostcart jobs view ${res.data?.jobId}\n`);
      } catch (err) {
        stop('Submission failed', true);
        handleApiError(err);
      }
    });

  listings
    .command('state <id> <newState>')
    .description(`Manually change listing state (${VALID_STATES.join(', ')})`)
    .action(async (id: string, newState: string) => {
      if (!VALID_STATES.includes(newState)) {
        console.error(`\n  ${color.error('✗')} Invalid state. Valid states: ${VALID_STATES.join(', ')}\n`);
        process.exit(1);
      }

      const stop = spinner(`Setting state to ${newState}...`);
      try {
        await api.post(`/api/listings/${id}/state`, { state: newState });
        stop(`State updated to ${stateColor(newState)}`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });
}

function handleApiError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(`  ${color.error('✗')} ${err.message} (HTTP ${err.statusCode})\n`);
  } else {
    console.error(`  ${color.error('✗')} ${String(err)}\n`);
  }
  process.exit(1);
}
