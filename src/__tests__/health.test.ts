/**
 * Health Endpoint Unit Test
 *
 * Stage 1 Gate: First passing automated test.
 * Verifies GET /api/health returns { status: 'ok' } with HTTP 200.
 *
 * This test satisfies the Stage 1 "new developer can run tests" gate
 * from Production Blueprint §Stage 1 Test Gate.
 */
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns HTTP 200 with { status: "ok" }', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('returns a JSON content-type response', async () => {
    const response = await GET();

    // Ensures the health check is always machine-readable
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
