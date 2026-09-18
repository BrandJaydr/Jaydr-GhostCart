import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '@/lib/http/client';
import { HostRateLimiter } from '@/lib/http/rate-limiter';

describe('HostRateLimiter & HttpClient', () => {
  let rateLimiter: HostRateLimiter;
  let client: HttpClient;

  beforeEach(() => {
    rateLimiter = new HostRateLimiter();
    rateLimiter.clear();
    client = new HttpClient({ rateLimiter, defaultMaxContentLengthBytes: 1024 * 1024 });
    client.clearMemoryCache();
    vi.restoreAllMocks();
  });

  describe('HostRateLimiter', () => {
    it('should acquire first slot without throttling', async () => {
      const delay = await rateLimiter.acquire('example.com');
      expect(delay).toBe(0);
    });

    it('should throttle subsequent rapid requests to the same host', async () => {
      await rateLimiter.acquire('example.com');
      const start = Date.now();
      const delay = await rateLimiter.acquire('example.com');
      const elapsed = Date.now() - start;

      expect(delay).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeGreaterThanOrEqual(delay);
    });
  });

  describe('HttpClient', () => {
    it('should fetch URL and cache GET responses', async () => {
      const mockHtml = '<html><head><title>Test Product</title></head><body><h1>Test</h1></body></html>';
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/html', 'content-length': String(mockHtml.length) }),
        text: async () => mockHtml,
      } as Response);

      // 1. Initial Request (Cache Miss)
      const res1 = await client.get('https://example.com/product/123');
      expect(res1.status).toBe(200);
      expect(res1.data).toBe(mockHtml);
      expect(res1.cached).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // 2. Second Request (Cache Hit)
      const res2 = await client.get('https://example.com/product/123');
      expect(res2.status).toBe(200);
      expect(res2.data).toBe(mockHtml);
      expect(res2.cached).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No new network call
    });

    it('should enforce max content length byte limits', async () => {
      const largeContent = 'A'.repeat(5000);
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/html', 'content-length': '5000' }),
        text: async () => largeContent,
      } as Response);

      const strictClient = new HttpClient({ defaultMaxContentLengthBytes: 1000 });

      await expect(strictClient.get('https://example.com/large', { skipRateLimiting: true })).rejects.toThrow(
        /exceeds limit/i,
      );
    });
  });
});
