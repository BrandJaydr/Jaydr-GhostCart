/**
 * Braille spinner for async operations.
 * Shows animated dots while waiting for a network call.
 *
 * Usage:
 *   const stop = spinner('Importing products...');
 *   await someAsyncWork();
 *   stop('Done!');           // shows ✓ Done!
 *   stop('Failed!', true);   // shows ✗ Failed!
 */

import { color, sym } from './theme.js';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function spinner(message: string): (done: string, isError?: boolean) => void {
  let i = 0;
  const isTTY = process.stdout.isTTY;

  if (!isTTY) {
    // Non-interactive (piped / CI) — just print the message
    process.stdout.write(`  ${message}\n`);
    return (done: string, isError = false) => {
      const icon = isError ? sym.fail : sym.ok;
      process.stdout.write(`  ${icon} ${done}\n`);
    };
  }

  process.stdout.write('\n');
  const interval = setInterval(() => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`  ${color.brand(FRAMES[i % FRAMES.length])} ${color.muted(message)}`);
    i++;
  }, 80);

  return (done: string, isError = false) => {
    clearInterval(interval);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    const icon = isError ? sym.fail : sym.ok;
    process.stdout.write(`  ${icon} ${done}\n\n`);
  };
}
