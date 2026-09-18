import { describe, it, expect, beforeEach } from 'vitest';
import { logger, getRecentLogs, clearRecentLogs, runWithCorrelationId } from '@/lib/logger';

describe('Developer Telemetry & Logging System', () => {
  beforeEach(() => {
    clearRecentLogs();
  });

  it('should capture structured logs in ring buffer with correlation ID', () => {
    runWithCorrelationId('cid-test-123', () => {
      logger.info('SCRAPER', 'Extracted 5 products from catalog', { count: 5 });
      logger.debug('HTTP', 'GET https://example.com/api 200 OK', { latencyMs: 42 });
    });

    const logs = getRecentLogs();
    expect(logs.length).toBe(2);

    const scraperLog = logs.find((l) => l.category === 'SCRAPER');
    expect(scraperLog).toBeDefined();
    expect(scraperLog?.correlationId).toBe('cid-test-123');
    expect(scraperLog?.level).toBe('info');
    expect(scraperLog?.message).toBe('Extracted 5 products from catalog');

    const httpLog = logs.find((l) => l.category === 'HTTP');
    expect(httpLog).toBeDefined();
    expect(httpLog?.correlationId).toBe('cid-test-123');
    expect(httpLog?.level).toBe('debug');
  });

  it('should filter logs by category, level, and search query', () => {
    logger.info('AI', 'Generated listing title for SKU-001');
    logger.error('WORKER', 'Failed to connect to database', { code: 'ECONNREFUSED' });
    logger.warn('REPRICING', 'Margin dropped below 15% threshold');

    // 1. Filter by Level
    const errorLogs = getRecentLogs({ level: 'error' });
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].category).toBe('WORKER');

    // 2. Filter by Category
    const aiLogs = getRecentLogs({ category: 'AI' });
    expect(aiLogs.length).toBe(1);
    expect(aiLogs[0].message).toContain('SKU-001');

    // 3. Filter by Search Query
    const searchLogs = getRecentLogs({ search: 'margin' });
    expect(searchLogs.length).toBe(1);
    expect(searchLogs[0].category).toBe('REPRICING');
  });
});
