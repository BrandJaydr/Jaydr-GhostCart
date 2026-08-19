/**
 * Products Commands
 *   ghostcart products list [--status <status>] [--json]
 *   ghostcart products view <id> [--json] [--web]
 *   ghostcart products import <file> [--json]
 *   ghostcart products approve <id>
 *   ghostcart products reject <id> --reason <text>
 */

import { Command } from 'commander';
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';
import { api, ApiError } from '../api-client.js';
import { loadConfig } from '../config.js';
import {
  color, sym, sectionHeader, webLink,
} from '../ui/theme.js';
import { renderTable, truncate } from '../ui/table.js';
import { spinner } from '../ui/spinner.js';

interface Product {
  id: string;
  title: string;
  supplier_price_cents: number;
  currency: string;
  availability: string;
  review_status?: string;
  imported_at: string;
}

export function registerProductCommands(program: Command): void {
  const products = program
    .command('products')
    .description('Manage your imported products');

  products
    .command('list')
    .description('List all products')
    .option('--status <status>', 'Filter by review status (pending, approved, rejected)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { status?: string; json?: boolean }) => {
      const stop = spinner('Loading products...');
      try {
        const query = opts.status ? `?status=${opts.status}` : '';
        const res = await api.get<Product[]>(`/api/products${query}`);
        stop('Done');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        const items = res.data ?? [];
        console.log(sectionHeader(`Products (${items.length} total)`));

        renderTable(
          ['ID', 'Title', 'Status', 'Price', 'Imported'],
          items.map((p) => [
            truncate(p.id, 8),
            truncate(p.title, 36),
            reviewStatusBadge(p.review_status ?? 'pending'),
            formatPrice(p.supplier_price_cents, p.currency),
            new Date(p.imported_at).toLocaleDateString(),
          ]),
        );

        console.log(`  ${sym.arrow} ${color.muted('View details:')} ghostcart products view <id>`);
        console.log(`  ${sym.arrow} ${color.muted('Import more:')} ghostcart products import <file.csv>\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  products
    .command('view <id>')
    .description('Show full product details')
    .option('--json', 'Output as JSON')
    .option('--web', 'Open in browser instead')
    .action(async (id: string, opts: { json?: boolean; web?: boolean }) => {
      const cfg = loadConfig();

      if (opts.web) {
        const url = `${cfg.baseUrl}/dashboard/products/${id}`;
        console.log('\n' + webLink(url) + '\n');
        return;
      }

      const stop = spinner('Loading product...');
      try {
        const res = await api.get<Product & {
          description?: string;
          primary_image_url?: string;
          last_refreshed_at?: string;
        }>(`/api/products/${id}`);
        stop('Done');

        const p = res.data!;
        if (opts.json) { console.log(JSON.stringify(p)); return; }

        console.log(sectionHeader('Product Details'));
        console.log(`  ${sym.bullet} ID:          ${color.muted(p.id)}`);
        console.log(`  ${sym.bullet} Title:       ${color.bold(p.title)}`);
        console.log(`  ${sym.bullet} Price:       ${color.success(formatPrice(p.supplier_price_cents, p.currency))}`);
        console.log(`  ${sym.bullet} Availability: ${p.availability}`);
        console.log(`  ${sym.bullet} Status:      ${reviewStatusBadge(p.review_status ?? 'pending')}`);
        console.log(`  ${sym.bullet} Imported:    ${new Date(p.imported_at).toLocaleString()}`);
        if (p.last_refreshed_at) {
          console.log(`  ${sym.bullet} Last refresh: ${new Date(p.last_refreshed_at).toLocaleString()}`);
        }
        if (p.description) {
          console.log('');
          console.log(`  ${color.header('Description:')}`);
          console.log(`  ${color.muted(truncate(p.description, 200))}`);
        }
        console.log('');
        console.log(`  ${sym.arrow} Approve:  ${color.muted(`ghostcart products approve ${id}`)}`);
        console.log(`  ${sym.arrow} Reject:   ${color.muted(`ghostcart products reject ${id} --reason "..."`)} `);
        console.log(webLink(`${cfg.baseUrl}/dashboard/products/${id}`));
        console.log('');
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  products
    .command('import <file>')
    .description('Import products from a CSV file')
    .option('--json', 'Output as JSON')
    .action(async (file: string, opts: { json?: boolean }) => {
      // Verify file exists
      try { statSync(file); } catch {
        console.error(`\n  ${color.error('✗')} File not found: ${color.muted(file)}\n`);
        process.exit(1);
      }

      const stop = spinner(`Uploading ${basename(file)}...`);
      try {
        const formData = new FormData();
        // Node 18+ supports Blob from streams; use a Buffer-based approach
        const { readFileSync } = await import('fs');
        const fileBuffer = readFileSync(file);
        const blob = new Blob([fileBuffer], { type: 'text/csv' });
        formData.append('file', blob, basename(file));

        const res = await api.upload<{ jobId: string; message: string }>(
          '/api/products/import',
          formData,
        );

        stop('Import queued');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        console.log(`  ${sym.bullet} Job ID: ${color.brand(res.data?.jobId ?? '—')}`);
        console.log(`  ${sym.bullet} ${res.data?.message ?? 'Import job queued.'}`);
        console.log('');
        console.log(`  ${sym.arrow} ${color.muted('Watch status:')} ghostcart jobs view ${res.data?.jobId}\n`);
      } catch (err) {
        stop('Upload failed', true);
        handleApiError(err);
      }
    });

  products
    .command('approve <id>')
    .description('Approve a product for use in listings')
    .action(async (id: string) => {
      const stop = spinner('Approving product...');
      try {
        await api.post(`/api/products/${id}/approve`, {});
        stop(`Product ${id} approved`);
        console.log(`  ${sym.arrow} ${color.muted('Create a listing:')} ghostcart listings draft ${id}\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  products
    .command('reject <id>')
    .description('Reject a product')
    .requiredOption('--reason <reason>', 'Reason for rejection')
    .action(async (id: string, opts: { reason: string }) => {
      const stop = spinner('Rejecting product...');
      try {
        await api.post(`/api/products/${id}/reject`, { reason: opts.reason });
        stop(`Product ${id} rejected`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });
}

function formatPrice(cents: number, currency = 'USD'): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

function reviewStatusBadge(status: string): string {
  const map: Record<string, string> = {
    pending:  color.warning('⚠ pending'),
    approved: color.success('✓ approved'),
    rejected: color.error('✗ rejected'),
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
