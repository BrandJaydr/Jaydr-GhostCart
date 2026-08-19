/**
 * ASCII Table Renderer
 *
 * Renders data as a properly-aligned ASCII table with box-drawing borders.
 * Supports optional `--json` mode (callers check that flag first).
 *
 * Usage:
 *   import { renderTable } from '../ui/table.js';
 *   renderTable(['ID', 'Title', 'Status'], rows.map(r => [r.id, r.title, r.status]));
 */

import { color, box } from './theme.js';

export type Row = (string | number | null | undefined)[];

/** Renders an ASCII table to stdout */
export function renderTable(headers: string[], rows: Row[]): void {
  if (rows.length === 0) {
    console.log(color.muted('  (no results)'));
    return;
  }

  // Column widths: max of header length and each cell length
  const widths = headers.map((h, i) =>
    Math.max(
      h.length,
      ...rows.map((r) => String(r[i] ?? '').length),
    ),
  );

  const totalWidth = widths.reduce((a, w) => a + w + 3, 1);

  const hr = (left: string, mid: string, cross: string, right: string) =>
    color.muted(
      left +
        widths.map((w) => box.horizontal.repeat(w + 2)).join(mid) +
        right,
    );

  const row = (cells: Row, isHeader = false) => {
    const formatted = cells.map((cell, i) => {
      const str = String(cell ?? '');
      const padded = str.padEnd(widths[i]);
      return isHeader ? color.header(padded) : padded;
    });
    return (
      color.muted(box.vertical) +
      formatted.map((f) => ` ${f} `).join(color.muted(box.vertical)) +
      color.muted(box.vertical)
    );
  };

  console.log('');
  console.log(hr(box.topLeft, box.teeTop, box.teeTop, box.topRight));
  console.log(row(headers, true));
  console.log(hr(box.teeLeft, box.cross, box.cross, box.teeRight));
  rows.forEach((r) => console.log(row(r)));
  console.log(hr(box.bottomLeft, box.teeBottom, box.teeBottom, box.bottomRight));
  console.log(color.muted(`  ${rows.length} result${rows.length === 1 ? '' : 's'}`));
  console.log('');

  // Suppress unused variable warning
  void totalWidth;
}

/** Truncates a string to maxLen with ellipsis */
export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
