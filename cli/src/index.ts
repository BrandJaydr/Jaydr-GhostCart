#!/usr/bin/env node
/**
 * GhostCart CLI — Entry Point
 *
 * A retro BBS-style terminal client for your GhostCart account.
 * Same account as the web dashboard, stripped down to what works
 * well in a text interface.
 *
 * Usage:
 *   ghostcart login
 *   ghostcart products list
 *   ghostcart listings list
 *   ghostcart jobs list
 *   ghostcart account usage
 *   ghostcart repricing suggest <id>
 *   ghostcart keys list
 *   ghostcart --help
 */

import { Command } from 'commander';
import { color, sym } from './ui/theme.js';
import { registerAuthCommands } from './commands/auth.js';
import { registerProductCommands } from './commands/products.js';
import { registerListingCommands } from './commands/listings.js';
import { registerJobCommands } from './commands/jobs.js';
import { registerAccountCommands } from './commands/account.js';
import { registerRepricingCommands } from './commands/repricing.js';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('ghostcart')
  .description(
    [
      '',
      color.brand('  ◈ GhostCart CLI') + color.muted(` v${VERSION}`),
      color.muted('  Terminal access to your GhostCart account.'),
      '',
      color.muted('  Run any command with --help to see its options.'),
      color.muted('  First time? Start with: ghostcart login'),
      '',
    ].join('\n'),
  )
  .version(VERSION, '-v, --version', 'Show version number')
  .addHelpText('after', [
    '',
    color.muted('  Quick start:'),
    `    ${color.cyan('ghostcart login')}`,
    `    ${color.cyan('ghostcart products list')}`,
    `    ${color.cyan('ghostcart listings list --state draft')}`,
    `    ${color.cyan('ghostcart jobs list')}`,
    '',
    color.muted('  Tips:'),
    `    ${sym.arrow} Add ${color.header('--json')} to any command for machine-readable output`,
    `    ${sym.arrow} Add ${color.header('--web')} to open in your browser instead`,
    `    ${sym.arrow} Use ${color.header('ghostcart keys create')} to generate an API key for agents`,
    '',
  ].join('\n'));

// Register all command groups
registerAuthCommands(program);
registerProductCommands(program);
registerListingCommands(program);
registerJobCommands(program);
registerAccountCommands(program);
registerRepricingCommands(program);

// Handle unknown commands
program.on('command:*', (operands: string[]) => {
  console.error(`\n  ${color.error('✗')} Unknown command: ${color.bold(operands.join(' '))}`);
  console.error(`  ${sym.arrow} Run ${color.header('ghostcart --help')} to see available commands.\n`);
  process.exit(1);
});

// Parse — if no args given, launch BBS TUI menu
if (process.argv.length <= 2) {
  import('./ui/main-menu.js').then(m => m.showMainMenu()).catch(err => {
    console.error(`\n  ${color.error('✗')} Unexpected error: ${String(err)}\n`);
    process.exit(1);
  });
} else {
  program.parseAsync(process.argv).catch((err: unknown) => {
    console.error(`\n  ${color.error('✗')} Unexpected error: ${String(err)}\n`);
    process.exit(1);
  });
}
