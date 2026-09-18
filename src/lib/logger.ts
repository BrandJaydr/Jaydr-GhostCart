/* eslint-disable no-console */
import { AsyncLocalStorage } from 'async_hooks';
import { EventEmitter } from 'events';

const correlationStorage = new AsyncLocalStorage<string>();

export const runWithCorrelationId = <T>(id: string, fn: () => T): T => {
  return correlationStorage.run(id, fn);
};

export const getCorrelationId = (): string | undefined => {
  return correlationStorage.getStore();
};

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEvent {
  id?: string;
  timestamp: string;
  level: LogLevel;
  correlationId?: string;
  tenantId?: string;
  category: string;
  message: string;
  metadata?: unknown;
}

export interface LogFilterOptions {
  tenantId?: string;
  level?: LogLevel | 'all';
  category?: string;
  correlationId?: string;
  search?: string;
  limit?: number;
  since?: string;
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
    if (REDACT_KEYS.some((k) => lowerKey.includes(k))) {
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

// Circular Ring Buffer for Developer Mode Telemetry (last 1,000 in-memory events)
const MAX_IN_MEMORY_LOGS = 1000;
const ringBuffer: LogEvent[] = [];
export const logEmitter = new EventEmitter();
logEmitter.setMaxListeners(50);

let logCounter = 0;

function log(level: LogLevel, category: string, message: string, metadata?: unknown) {
  const timestamp = new Date().toISOString();
  const correlationId = getCorrelationId();
  const safeMetadata = metadata ? redact(metadata) : undefined;
  logCounter += 1;

  // Extract optional tenantId from metadata if passed
  let tenantId: string | undefined;
  if (safeMetadata && typeof safeMetadata === 'object' && 'tenantId' in safeMetadata) {
    tenantId = String((safeMetadata as { tenantId?: unknown }).tenantId);
  }

  const event: LogEvent = {
    id: `log_${Date.now()}_${logCounter}`,
    timestamp,
    level,
    category: category.toUpperCase(),
    message,
    correlationId,
    tenantId,
    metadata: safeMetadata,
  };

  // Add to in-memory ring buffer
  ringBuffer.push(event);
  if (ringBuffer.length > MAX_IN_MEMORY_LOGS) {
    ringBuffer.shift();
  }

  // Emit event for real-time live log subscriptions (SSE / Developer Console)
  logEmitter.emit('log', event);

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    console.log(JSON.stringify(event));
  } else {
    const color = colors[level] || resetColor;
    const cidStr = correlationId ? ` [CID: ${correlationId}]` : '';
    const metaStr = safeMetadata ? `\nMetadata: ${JSON.stringify(safeMetadata, null, 2)}` : '';
    console.log(
      `${color}[${level.toUpperCase()}]${resetColor} [${event.category}]${cidStr} ${message}${metaStr}`,
    );
  }
}

/**
 * Query recent logs from the ring buffer with filters
 */
export function getRecentLogs(filter: LogFilterOptions = {}): LogEvent[] {
  let results = [...ringBuffer].reverse();

  if (filter.level && filter.level !== 'all') {
    results = results.filter((e) => e.level === filter.level);
  }

  if (filter.category && filter.category !== 'ALL') {
    const targetCat = filter.category.toUpperCase();
    results = results.filter((e) => e.category === targetCat || e.category.includes(targetCat));
  }

  if (filter.correlationId) {
    results = results.filter((e) => e.correlationId === filter.correlationId);
  }

  if (filter.tenantId) {
    results = results.filter((e) => !e.tenantId || e.tenantId === filter.tenantId);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    results = results.filter(
      (e) =>
        e.message.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.correlationId && e.correlationId.toLowerCase().includes(q)) ||
        (e.metadata && JSON.stringify(e.metadata).toLowerCase().includes(q)),
    );
  }

  if (filter.since) {
    const sinceTime = new Date(filter.since).getTime();
    results = results.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
  }

  const limit = filter.limit || 100;
  return results.slice(0, limit);
}

export function clearRecentLogs(): void {
  ringBuffer.length = 0;
}

export const logger = {
  info: (category: string, message: string, metadata?: unknown) =>
    log('info', category, message, metadata),
  warn: (category: string, message: string, metadata?: unknown) =>
    log('warn', category, message, metadata),
  error: (category: string, message: string, metadata?: unknown) =>
    log('error', category, message, metadata),
  debug: (category: string, message: string, metadata?: unknown) =>
    log('debug', category, message, metadata),
};
