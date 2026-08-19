/**
 * GhostCart CLI — Theme
 *
 * Retro BBS-style terminal aesthetic.
 * Monospace, ASCII box-drawing, color-coded output.
 * All color calls go through this module — never import chalk directly.
 */

import chalk from 'chalk';

// ── Palette ──────────────────────────────────────────────────────────────────
const cerulean = chalk.hex('#007BA7');
const skyBlue = chalk.hex('#87CEEB');
const electricBlue = chalk.hex('#00BFFF');
const iceWhite = chalk.hex('#E0F7FA');
const ghostGreen = chalk.hex('#39FF14');
const warningAmber = chalk.hex('#FFD600');
const errorRed = chalk.hex('#FF3B30');
const dimSlate = chalk.hex('#546E7A');
const hotPink = chalk.hex('#FF007F');
const ghostPurple = chalk.hex('#BD00FF');

export const color = {
  brand:    cerulean.bold,
  magenta:  hotPink.bold,
  purple:   ghostPurple.bold,
  header:   cerulean.bold,
  success:  ghostGreen,
  warning:  warningAmber,
  error:    errorRed.bold,
  info:     electricBlue,
  muted:    dimSlate,
  bold:     chalk.bold,
  white:    iceWhite,
  dim:      chalk.dim,
  cyan:     skyBlue,
  pink:     hotPink,
  yellow:   chalk.yellow,
  active:   electricBlue.bold,
  border:   cerulean,
};

// ── Status symbols (ASCII only — no emoji) ───────────────────────────────────
export const sym = {
  ok:      color.success('✓'),
  warn:    color.warning('⚠'),
  fail:    color.error('✗'),
  arrow:   color.pink('→'),
  bullet:  color.cyan('◆'),
  diamond: color.pink('◈'),
  pipe:    color.muted('║'),
};

// ── Listing state coloring ────────────────────────────────────────────────────
export function stateColor(state: string): string {
  const map: Record<string, (s: string) => string> = {
    draft:            color.dim,
    ready_for_review: color.warning,
    queued:           color.info,
    submitted:        color.cyan,
    published:        color.success,
    failed:           color.error,
  };
  return (map[state] ?? color.white)(state);
}

// ── Box drawing ───────────────────────────────────────────────────────────────
export const box = {
  topLeft:     '╔',
  topRight:    '╗',
  bottomLeft:  '╚',
  bottomRight: '╝',
  horizontal:  '═',
  vertical:    '║',
  teeLeft:     '╠',
  teeRight:    '╣',
  cross:       '╬',
  teeTop:      '╦',
  teeBottom:   '╩',
};

export function getTermWidth(): number {
  return process.stdout.columns || 80;
}

/** Draw a full-width horizontal divider */
export function divider(width = getTermWidth()): string {
  return color.border(box.horizontal.repeat(width));
}

/** Wrap text in a simple ASCII box */
export function boxWrap(lines: string[], width = 50): string {
  const top    = box.topLeft + box.horizontal.repeat(width) + box.topRight;
  const bottom = box.bottomLeft + box.horizontal.repeat(width) + box.bottomRight;
  const body   = lines.map(
    (l) => box.vertical + ' ' + l.padEnd(width - 1) + box.vertical
  );
  return [top, ...body, bottom].join('\n');
}

export function centeredLine(text: string, width = getTermWidth()): string {
  const rawTextLength = text.replace(/\u001b\[\d+m/g, '').length;
  // Subtract 2 for the borders
  const innerWidth = width - 2;
  const paddingLen = Math.max(0, innerWidth - rawTextLength);
  const leftPad = ' '.repeat(Math.floor(paddingLen / 2));
  const rightPad = ' '.repeat(Math.ceil(paddingLen / 2));
  
  return color.border(box.vertical) + leftPad + text + rightPad + color.border(box.vertical);
}

export function fullWidthBox(lines: string[], width = getTermWidth()): string[] {
  const hBorder = box.horizontal.repeat(width - 2);
  const top = color.border(box.topLeft + hBorder + box.topRight);
  const bottom = color.border(box.bottomLeft + hBorder + box.bottomRight);
  const paddedLines = lines.map(l => {
    const rawLen = l.replace(/\u001b\[\d+m/g, '').length;
    const pad = ' '.repeat(Math.max(0, width - 2 - rawLen - 2)); // 2 for left padding
    return color.border(box.vertical) + '  ' + l + pad + color.border(box.vertical);
  });
  return [top, ...paddedLines, bottom];
}

// ── Splash banner ─────────────────────────────────────────────────────────────
export function splash(version: string, tenantName?: string): string {
  const width = getTermWidth();
  const innerWidth = width - 2;
  const hBorder = box.horizontal.repeat(innerWidth);
  
  const title = `◈ GHOSTCART ◈`;
  const subtitle = `AUTONOMOUS RESELLER NEXUS v${version}`;
  const status = `[ STATUS: ACTIVE ]`;
  const tenant = tenantName ? `[ TENANT: ${tenantName.toUpperCase()} ]` : `[ SECURE NET ]`;
  
  // Center content
  const centerText = ` ${title}  ${color.muted('║')}  ${subtitle}  ${color.muted('║')}  ${color.success(status)}  ${color.muted('║')}  ${color.magenta(tenant)} `;
  const rawTextLength = centerText.replace(/\u001b\[\d+m/g, '').length;
  const paddingLen = Math.max(0, innerWidth - rawTextLength);
  const leftPad = ' '.repeat(Math.floor(paddingLen / 2));
  const rightPad = ' '.repeat(Math.ceil(paddingLen / 2));
  
  const contentLine = color.border(box.vertical) + leftPad + centerText + rightPad + color.border(box.vertical);
  
  const sub1 = `AUTOMATION • MULTI-CHANNEL ORCHESTRATION • AI-DYNAMIC REPRICING • INVENTORY SYNC`;
  const sub1Pad = ' '.repeat(Math.max(0, innerWidth - sub1.length));
  const sub1Line = color.border(box.vertical) + ' '.repeat(Math.floor(sub1Pad.length / 2)) + color.muted(sub1) + ' '.repeat(Math.ceil(sub1Pad.length / 2)) + color.border(box.vertical);
  
  const sub2 = `--- enter the grid. operate with precision. ---`;
  const sub2Pad = ' '.repeat(Math.max(0, innerWidth - sub2.length));
  const sub2Line = color.border(box.vertical) + ' '.repeat(Math.floor(sub2Pad.length / 2)) + color.cyan(sub2) + ' '.repeat(Math.ceil(sub2Pad.length / 2)) + color.border(box.vertical);

  return [
    '',
    color.border(box.topLeft + hBorder + box.topRight),
    contentLine,
    color.border(box.teeLeft + hBorder + box.teeRight),
    sub1Line,
    sub2Line,
    color.border(box.bottomLeft + hBorder + box.bottomRight),
    ''
  ].join('\n');
}

// ── Section header ────────────────────────────────────────────────────────────
export function sectionHeader(title: string): string {
  return '\n' + color.header(`  ${title}`) + '\n';
}

// ── Link line ─────────────────────────────────────────────────────────────────
export function webLink(url: string): string {
  return `  ${sym.arrow} ${color.muted('Open in browser:')} ${color.info(url)}`;
}
