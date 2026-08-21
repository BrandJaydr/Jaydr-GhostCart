import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportForm from '@/components/import/ImportForm';
import { ProductImportSchema } from '@/lib/validation/schemas';

/**
 * @agent:investigator Regression guard for ERR-022 (Fix 1).
 * Asserts ImportForm posts the contract-aligned payload that validates
 * against ProductImportSchema and consumes `data.jobId` (not `data.id`).
 */
describe('ImportForm - payload contract (ERR-022)', () => {
  const SUPPLIERS = [{ id: 'sup-mock-1', adapterId: 'mock', name: 'Mock Supplier' }];

  const mockFetch = vi.fn();

  beforeEach(() => {
    // Deterministic idempotency key (crypto.randomUUID is not stable across envs)
    vi.stubGlobal('crypto', {
      ...globalThis.crypto,
      randomUUID: () => 'test-idempotency-key',
    });

    mockFetch.mockImplementation(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url.includes('/api/suppliers')) {
        return new Response(JSON.stringify({ success: true, data: SUPPLIERS }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/api/products')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { jobId: 'job-abc', status: 'queued' },
          }),
          { status: 202, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ success: false, error: 'not mocked' }), {
        status: 404,
      });
    });
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    mockFetch.mockReset();
  });

  it('posts a body matching ProductImportSchema and consumes jobId (not data.id)', async () => {
    render(<ImportForm />);

    // suppliers load; first supplier is default-selected
    await screen.findByText(/Mock Supplier/i);
    fireEvent.click(screen.getByRole('button', { name: /Mock Supplier/i }));

    fireEvent.change(screen.getByLabelText(/Product URL/i), {
      target: { value: 'https://example.com/p/1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Import Product/i }));

    const postCall = await waitFor(() =>
      mockFetch.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('/api/products'),
      ),
    );

    expect(postCall).toBeDefined();
    const [, init] = postCall as [RequestInfo, RequestInit];
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });

    const body = JSON.parse(init.body as string);
    // Shape must validate against the real import schema
    expect(() => ProductImportSchema.parse(body)).not.toThrow();
    expect(body).toEqual({
      url: 'https://example.com/p/1',
      supplierId: 'sup-mock-1',
      idempotencyKey: 'test-idempotency-key',
    });

    // 202 queued -> success screen shows the jobId consumed from data.jobId
    await screen.findByText(/Import queued/i);
    await screen.findByText(/job-abc/i);
  });
});
