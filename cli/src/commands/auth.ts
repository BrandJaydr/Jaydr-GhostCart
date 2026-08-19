/**
 * Auth Commands
 *   ghostcart login
 *   ghostcart logout
 *   ghostcart whoami
 *   ghostcart keys list
 *   ghostcart keys create [--label <name>] [--expires-in-days <n>]
 *   ghostcart keys revoke <id>
 */

import { Command } from 'commander';
import { input, password, confirm } from '@inquirer/prompts';
import {
  saveConfig,
  clearConfig,
  loadConfig,
  DEFAULT_BASE_URL,
} from '../config.js';
import { api, ApiError } from '../api-client.js';
import {
  color,
  sym,
  splash,
  sectionHeader,
  webLink,
} from '../ui/theme.js';
import { renderTable, truncate } from '../ui/table.js';
import { spinner } from '../ui/spinner.js';

export function registerAuthCommands(program: Command): void {
  // ── login ───────────────────────────────────────────────────────────────────
  program
    .command('login')
    .description('Sign in to your GhostCart account')
    .option('--url <url>', 'GhostCart server URL', DEFAULT_BASE_URL)
    .action(async (opts: { url: string }) => {
  console.log(splash('1.0.0'));
  console.log(`  ${color.magenta('⚡ SECURE ACCESS TERMINAL ⚡')}`);
  console.log(`  ${color.cyan('>_ authenticate identity through the network\n')}`);

  const email = await input({ message: `  ${color.cyan('▶ USER IDENTIFIER:')}` });
  const pass  = await password({ message: `  ${color.cyan('▶ AUTHENTICATION KEY:')}`, mask: '*' });

  const stop = spinner('Authenticating...');

  let res: Response;
  try {
    res = await api.loginPost(opts.url || DEFAULT_BASE_URL, { email, password: pass });
  } catch (err) {
    stop('Connection failed', true);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ${color.muted(msg)}\n`);
    return;
  }

  if (!res.ok) {
    stop('Login failed', true);
    const body = await res.json().catch(() => ({})) as { error?: string };
    console.error(`  ${color.error(body.error ?? 'Invalid email or password')}\n`);
    return;
  }

  const body = await res.json() as {
    data: { token: string; user: { email: string; role: string; tenantId: string } };
  };
  const { token, user } = body.data;

  saveConfig({
    baseUrl:  opts.url || DEFAULT_BASE_URL,
    token,
    email:    user.email,
    tenantId: user.tenantId,
    role:     user.role,
  });

  stop(`Logged in as ${color.brand(user.email)}`);
  console.log(`  ${sym.bullet} Role:   ${color.header(user.role)}`);
  console.log(`  ${sym.bullet} Tenant: ${color.muted(user.tenantId)}`);
  console.log('');
    });

  // ── logout ──────────────────────────────────────────────────────────────────
  program
    .command('logout')
    .description('Sign out and clear local credentials')
    .action(async () => {
      const cfg = loadConfig();
      if (!cfg.token) {
        console.log(`\n  ${sym.warn} Not logged in.\n`);
        return;
      }
      const yes = await confirm({ message: `  Log out ${cfg.email ?? 'current user'}?` });
      if (!yes) { console.log('  Cancelled.\n'); return; }
      clearConfig();
      console.log(`\n  ${sym.ok} Logged out.\n`);
    });

  // ── whoami ──────────────────────────────────────────────────────────────────
  program
    .command('whoami')
    .description('Show current logged-in user')
    .option('--json', 'Output as JSON')
    .action((opts: { json?: boolean }) => {
      const cfg = loadConfig();
      if (!cfg.token) {
        console.log(`\n  ${sym.warn} Not logged in. Run: ghostcart login\n`);
        return;
      }
      if (opts.json) {
        console.log(JSON.stringify({ email: cfg.email, role: cfg.role, tenantId: cfg.tenantId }));
        return;
      }
      console.log(sectionHeader('Current Session'));
      console.log(`  ${sym.bullet} Email:   ${color.brand(cfg.email ?? '—')}`);
      console.log(`  ${sym.bullet} Role:    ${color.header(cfg.role ?? '—')}`);
      console.log(`  ${sym.bullet} Tenant:  ${color.muted(cfg.tenantId ?? '—')}`);
      console.log(`  ${sym.bullet} Server:  ${color.muted(cfg.baseUrl ?? '—')}`);
      console.log('');
    });

  // ── keys ────────────────────────────────────────────────────────────────────
  const keys = program.command('keys').description('Manage API keys for CLI and agent access');

  keys
    .command('list')
    .description('List your active API keys')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      const stop = spinner('Fetching keys...');
      try {
        const res = await api.get<{
          id: string;
          key_prefix: string;
          label: string | null;
          last_used_at: string | null;
          created_at: string;
        }[]>('/api/auth/keys');

        stop('Done');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        console.log(sectionHeader('Your API Keys'));

        if (!res.data?.length) {
          console.log(`  ${color.muted('·')} No keys found. Create one with: ghostcart keys create\n`);
          return;
        }

        renderTable(
          ['ID', 'Prefix', 'Label', 'Last Used', 'Created'],
          res.data.map((k) => [
            truncate(k.id, 8),
            k.key_prefix,
            k.label ?? color.muted('(unlabelled)'),
            k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : color.muted('never'),
            new Date(k.created_at).toLocaleDateString(),
          ]),
        );
        console.log(`  ${sym.arrow} ${color.muted('Revoke a key:')} ghostcart keys revoke <id>\n`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  keys
    .command('create')
    .description('Generate a new API key (shown ONCE — store it safely)')
    .option('--label <label>', 'Human-readable name for this key')
    .option('--expires-in-days <days>', 'Days until this key expires (default: never)', parseInt)
    .option('--json', 'Output as JSON')
    .action(async (opts: { label?: string; expiresInDays?: number; json?: boolean }) => {
      const stop = spinner('Generating key...');
      try {
        const res = await api.post<{
          id: string;
          token: string;
          keyPrefix: string;
          label: string | null;
          expiresAt: string | null;
          warning: string;
        }>('/api/auth/keys', {
          label: opts.label,
          expiresInDays: opts.expiresInDays,
        });

        stop('Key generated');

        if (opts.json) { console.log(JSON.stringify(res.data)); return; }

        const k = res.data!;
        console.log('');
        console.log(`  ${sym.ok} ${color.bold('New API key created')}`);
        console.log('');
        console.log(`  ${sym.bullet} ID:    ${color.muted(k.id)}`);
        console.log(`  ${sym.bullet} Label: ${color.header(k.label ?? '(unlabelled)')}`);
        console.log(`  ${sym.bullet} Token: ${color.brand(k.token)}`);
        if (k.expiresAt) {
          console.log(`  ${sym.bullet} Expires: ${new Date(k.expiresAt).toLocaleDateString()}`);
        }
        console.log('');
        console.log(`  ${color.warning('⚠')} ${color.bold('Store this token now — it will NOT be shown again.')}`);
        console.log('');
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  keys
    .command('revoke <id>')
    .description('Revoke an API key by ID')
    .action(async (id: string) => {
      const yes = await confirm({ message: `  Revoke key ${color.muted(id)}?` });
      if (!yes) { console.log('  Cancelled.\n'); return; }

      const stop = spinner('Revoking key...');
      try {
        await api.delete(`/api/auth/keys/${id}`);
        stop(`Key ${id} revoked`);
      } catch (err) {
        stop('Failed', true);
        handleApiError(err);
      }
    });

  // ── config (url override) ───────────────────────────────────────────────────
  const cfg = program.command('config').description('CLI configuration');

  cfg
    .command('set-url <url>')
    .description('Set the GhostCart server URL')
    .action((url: string) => {
      saveConfig({ baseUrl: url });
      console.log(`\n  ${sym.ok} Server URL set to ${color.brand(url)}\n`);
    });
}

function handleApiError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(`  ${color.error('✗')} ${err.message} (HTTP ${err.statusCode})\n`);
    if (err.details) {
      console.error(`  ${color.muted(JSON.stringify(err.details))}\n`);
    }
  } else {
    console.error(`  ${color.error('✗')} Unexpected error: ${String(err)}\n`);
  }
  process.exit(1);
}
