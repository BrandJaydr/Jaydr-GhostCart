/**
 * Repricing Commands
 *   ghostcart repricing suggest <listing-id> [--json]
 *   ghostcart repricing apply <listing-id>
 *   ghostcart repricing pause
 *   ghostcart repricing resume
 */

import { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import { api, ApiError } from '../api-client.js';
import { color, sym, sectionHeader, webLink } from '../ui/theme.js';
import { loadConfig } from '../config.js';
import { spinner } from '../ui/spinner.js';

interface RepricingSuggestion {
  listingId: string;
  currentPriceCents: number;
  suggestedPriceCents: number;
  currency: string;
  marginPercent: number;
  reason: string;
}

export function registerRepricingCommands(program: Command): void {
  const repricing = program
    .command('repricing')
    .description('Price suggestions and automation controls');

  repricing
    .command('suggest <listing-id>')
    .description('Get a repricing suggestion for a listing')
    .option('--json', 'Output as JSON')
    .option('--web', 'Open repricing UI in browser')
    .action(async (listingId: string, opts: { json?: boolean; web?: boolean }) => {
      const cfg = loadConfig();

      if (opts.web) {
        const url = `${cfg.baseUrl}/dashboard/listings/${listingId}#repricing`;
        console.log('\n' + webLink(url) + '\n');
        return;
      }

      const stop = spinner('Calculating suggestion...');
      try {
        const res = await api.post<RepricingSuggestion>(
          '/api/repricing/suggest',
          { listingId },
        );
        stop('Done');

        const s = res.data!;
        if (opts.json) { console.log(JSON.stringify(s)); return; }

        const currentStr = `${s.currency} ${(s.currentPriceCents / 100).toFixed(2)}`;
        const suggestedStr = `${s.currency} ${(s.suggestedPriceCents / 100).toFixed(2)}`;
        const delta = s.suggestedPriceCents - s.currentPriceCents;
        const deltaStr = (delta >= 0 ? '+' : '') + `${s.currency} ${(delta / 100).toFixed(2)}`;
        const deltaColor = delta >= 0 ? color.success : color.error;

        console.log(sectionHeader('Repricing Suggestion'));
        console.log(`  ${sym.bullet} Listing:   ${color.muted(s.listingId)}`);
        console.log(`  ${sym.bullet} Current:   ${color.muted(currentStr)}`);
        console.log(`  ${sym.bullet} Suggested: ${color.bold(suggestedStr)} (${deltaColor(deltaStr)})`);
        console.log(`  ${sym.bullet} Margin:    ${color.header(`${s.marginPercent.toFixed(1)}%`)}`);
        console.log(`  ${sym.bullet} Reason:    ${color.muted(s.reason)}`);
        console.log('');
        console.log(`  ${sym.arrow} ${color.muted('Apply this price:')} ghostcart repricing apply ${listingId}\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  repricing
    .command('apply <listing-id>')
    .description('Apply the suggested repricing to a listing')
    .action(async (listingId: string) => {
      const yes = await confirm({
        message: `  Apply suggested price to listing ${color.muted(listingId)}?`,
      });
      if (!yes) { console.log('  Cancelled.\n'); return; }

      const stop = spinner('Applying price...');
      try {
        await api.post('/api/repricing/apply', { listingId });
        stop('Price applied');
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  repricing
    .command('pause')
    .description('Pause all automatic repricing globally')
    .action(async () => {
      const yes = await confirm({
        message: `  ${color.warning('Pause all automatic repricing?')} (affects all listings)`,
      });
      if (!yes) { console.log('  Cancelled.\n'); return; }

      const stop = spinner('Pausing repricing...');
      try {
        await api.post('/api/repricing/pause', {});
        stop('Automatic repricing paused');
        console.log(`  ${sym.arrow} ${color.muted('Resume:')} ghostcart repricing resume\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  repricing
    .command('resume')
    .description('Resume automatic repricing')
    .action(async () => {
      const stop = spinner('Resuming repricing...');
      try {
        await api.post('/api/repricing/resume', {});
        stop('Automatic repricing resumed');
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
