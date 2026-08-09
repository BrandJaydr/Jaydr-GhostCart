/**
 * ProductCorrectionForm Component Tests — Stage 2 Scaffold
 *
 * Tests align with the current scaffold component:
 *   - heading + Save/Cancel actions that exist today
 *   - loading-disabled buttons
 *   - unimplemented features (correction callback, confidence display, revert)
 *     are marked `it.skip` with `@agent:forge` TODOs rather than fake-passing.
 *
 * Reference: Production Blueprint §6.2 (review-before-use state)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCorrectionForm } from '@/components/import/ProductCorrectionForm';
import type { CanonicalProduct } from '@/lib/types/canonical';

describe('ProductCorrectionForm', () => {
  const mockProduct: CanonicalProduct = {
    id: 'prod_123',
    tenantId: 'tenant_001',
    title: 'Sample Product',
    description: 'Sample description',
    identifiers: { sku: 'SKU-001' },
    primaryImageUrl: null,
    additionalImageUrls: [],
    supplierPriceCents: 2999,
    currency: 'USD',
    availability: 'in_stock',
    sourceUrl: 'https://example.com/product/123',
    supplierId: 'mock',
    rawSourceMetadata: {},
    confidence: [
      { field: 'title', score: 1.0, warnings: [] },
      { field: 'description', score: 0.8, warnings: ['Low confidence'] },
    ],
    importedAt: new Date().toISOString(),
    lastRefreshedAt: null,
  };

  it('should render the correction heading', () => {
    render(<ProductCorrectionForm product={mockProduct} onSaveCorrections={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Correct Product Data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Correct Product Data/i }).tagName).toBe('H2');
  });

  it('should render the save button', () => {
    render(<ProductCorrectionForm product={mockProduct} onSaveCorrections={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Save Corrections/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel is clicked (when provided)', async () => {
    const onCancel = vi.fn();
    render(
      <ProductCorrectionForm
        product={mockProduct}
        onSaveCorrections={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons while loading', () => {
    render(
      <ProductCorrectionForm
        product={mockProduct}
        onSaveCorrections={vi.fn()}
        isLoading={true}
      />,
    );
    const save = screen.getByRole('button', { name: /Saving/i });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-busy', 'true');
  });

  // ── Unimplemented scaffold features (do not produce fake green) ────────────
  it.skip('@agent:forge should call onSaveCorrections with edited values on save', () => {
    // TODO: implement form state + persistence, then assert the callback payload.
  });

  it.skip('@agent:forge should display per-field confidence scores and warnings', () => {
    // TODO: render confidence/badges per field once component logic lands.
  });

  it.skip('@agent:forge should allow reverting a field to its original value', () => {
    // TODO: add revert control + wire user_corrections rehydration.
  });
});
