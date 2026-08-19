import { color, box, getTermWidth } from './theme.js';

export function clearScreen(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1Bc'); // ANSI reset to clear screen and home cursor
  } else {
    console.log('\n'.repeat(50));
  }
}

export function drawHeaderBar(leftText: string, rightText: string): string {
  const width = getTermWidth();
  const innerWidth = width - 2;
  const paddingLen = Math.max(0, innerWidth - leftText.replace(/\u001b\[\d+m/g, '').length - rightText.replace(/\u001b\[\d+m/g, '').length - 4);
  const pad = ' '.repeat(paddingLen);
  
  return color.border(box.vertical) + '  ' + leftText + pad + rightText + '  ' + color.border(box.vertical);
}

export function drawStatusBar(items: string[]): string {
  const width = getTermWidth();
  const innerWidth = width - 2;
  const content = items.join(`  ${color.border(box.vertical)}  `);
  const rawTextLength = content.replace(/\u001b\[\d+m/g, '').length;
  const paddingLen = Math.max(0, innerWidth - rawTextLength - 4);
  const pad = ' '.repeat(paddingLen); // Align left
  
  return color.border(box.vertical) + '  ' + content + pad + '  ' + color.border(box.vertical);
}

export function drawFrame(contentLines: string[], header?: string, status?: string): string {
  const width = getTermWidth();
  const innerWidth = width - 2;
  const hBorder = box.horizontal.repeat(innerWidth);
  
  const frame: string[] = [];
  
  // Top border
  frame.push(color.border(box.topLeft + hBorder + box.topRight));
  
  // Header
  if (header) {
    frame.push(header);
    frame.push(color.border(box.teeLeft + hBorder + box.teeRight));
  }
  
  // Content (pad each line to innerWidth)
  for (const line of contentLines) {
    const rawLen = line.replace(/\u001b\[\d+m/g, '').length;
    const pad = ' '.repeat(Math.max(0, innerWidth - rawLen));
    frame.push(color.border(box.vertical) + line + pad + color.border(box.vertical));
  }
  
  // Status
  if (status) {
    frame.push(color.border(box.teeLeft + hBorder + box.teeRight));
    frame.push(status);
  }
  
  // Bottom border
  frame.push(color.border(box.bottomLeft + hBorder + box.bottomRight));
  
  return frame.join('\n');
}

export function renderScreen(contentLines: string[], header?: string, status?: string): void {
  clearScreen();
  console.log(drawFrame(contentLines, header, status));
}
