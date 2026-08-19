/* eslint-disable no-console */
import { AsyncLocalStorage } from 'async_hooks';

const correlationStorage = new AsyncLocalStorage<string>();

export const runWithCorrelationId = <T>(id: string, fn: () => T): T => {
  return correlationStorage.run(id, fn);
};

export const getCorrelationId = (): string | undefined => {
  return correlationStorage.getStore();
};

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  correlationId?: string;
  category: string;
  message: string;
  metadata?: unknown;
}

const REDACT_KEYS = [
  'password',
  'accesstoken',
  'refreshtoken',
  'clientsecret',
  'client_id',
  'client_secret',
  'authorization',
  'token',
];

export function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const result: Record<string, unknown> = {};
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const lowerKey = key.toLowerCase();
    if (REDACT_KEYS.some(k => lowerKey.includes(k))) {
      result[key] = '[REDACTED]';
    } else if (typeof record[key] === 'object') {
      result[key] = redact(record[key]);
    } else {
      result[key] = record[key];
    }
  }
  return result;
}

const colors: Record<LogLevel, string> = {
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[90m', // Gray
};
const resetColor = '\x1b[0m';

function log(level: LogLevel, category: string, message: string, metadata?: unknown) {
  const timestamp = new Date().toISOString();
  const correlationId = getCorrelationId();
  const safeMetadata = metadata ? redact(metadata) : undefined;

  const event: LogEvent = {
    timestamp,
    level,
    category: category.toUpperCase(),
    message,
    correlationId,
    metadata: safeMetadata,
  };

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    console.log(JSON.stringify(event));
  } else {
    const color = colors[level] || resetColor;
    const cidStr = correlationId ? ` [CID: ${correlationId}]` : '';
    const metaStr = safeMetadata ? `\nMetadata: ${JSON.stringify(safeMetadata, null, 2)}` : '';
    console.log(
      `${color}[${level.toUpperCase()}]${resetColor} [${event.category}]${cidStr} ${message}${metaStr}`
    );
  }
}

export const logger = {
  info: (category: string, message: string, metadata?: unknown) => log('info', category, message, metadata),
  warn: (category: string, message: string, metadata?: unknown) => log('warn', category, message, metadata),
  error: (category: string, message: string, metadata?: unknown) => log('error', category, message, metadata),
  debug: (category: string, message: string, metadata?: unknown) => log('debug', category, message, metadata),
};
