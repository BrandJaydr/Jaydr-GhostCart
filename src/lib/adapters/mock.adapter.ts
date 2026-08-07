import type { ISupplierAdapter } from './supplier.interface';
import type { CanonicalProduct } from '@/lib/types/canonical';

/**
 * MockSupplierAdapter — Stage 1 Fixture Adapter
 *
 * Implements ISupplierAdapter using hardcoded fixture data.
 * Used in Stage 1 so screens can render without a real supplier integration.
 *
 * IMPORTANT BOUNDARIES (Forge rules):
 * ✅ Returns fixture data shaped to CanonicalProduct spec
 * ✅ Isolated here — mock logic must NOT appear in components or API routes
 * ✅ Swappable via adapter factory — no code changes required to replace with real adapter
 * ❌ Does NOT make network requests
 * ❌ Does NOT implement business logic
 *
 * @agent:atlas Replace with real adapter in Stage 2 — register via adapter factory
 * @agent:atlas Fixture data lives here to keep it out of components (Blueprint §Stage 1)
 */
export class MockSupplierAdapter implements ISupplierAdapter {
  readonly adapterId = 'mock';

  async validateConnection(): Promise<{ valid: boolean; reason?: string }> {
    // Mock always connects successfully
    return { valid: true };
  }

  async importProduct(url: string, tenantId: string): Promise<CanonicalProduct> {
    // TODO: @agent:atlas Replace with real adapter call in Stage 2
    return {
      id: `product_fixture_${Date.now()}`,
      tenantId,
      title: '[FIXTURE] Sample Product Title',
      description: '[FIXTURE] Sample product description for Stage 1 testing.',
      identifiers: { sku: 'FIXTURE-SKU-001' },
      primaryImageUrl: null,
      additionalImageUrls: [],
      supplierPriceCents: 2999, // $29.99
      currency: 'USD',
      availability: 'in_stock',
      sourceUrl: url,
      supplierId: this.adapterId,
      rawSourceMetadata: { fixture: true, originalUrl: url },
      confidence: [
        { field: 'title', score: 1.0, warnings: [] },
        { field: 'description', score: 0.7, warnings: ['Fixture data — not real content'] },
      ],
      importedAt: new Date().toISOString(),
      lastRefreshedAt: null,
    };
  }

  async fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct> {
    // TODO: @agent:atlas Replace with real adapter call in Stage 2
    return this.importProduct(`fixture://products/${productId}`, tenantId);
  }
}

/** Default mock adapter instance for Stage 1 use */
export const mockAdapter = new MockSupplierAdapter();

/**
 * Stage 1 fixture product for the `GET /api/products` list endpoint.
 *
 * @agent:atlas Replace with a real tenant-scoped DB query once
 * `@agent:archivist` completes the migration TODOs (RLS, seeded data).
 */
export const mockProduct: CanonicalProduct = {
  id: 'prod_fixture_1',
  tenantId: 'tenant_demo',
  title: '[FIXTURE] Sample Product Title',
  description: '[FIXTURE] Sample product description for Stage 1 testing.',
  identifiers: { sku: 'FIXTURE-SKU-001' },
  primaryImageUrl: null,
  additionalImageUrls: [],
  supplierPriceCents: 2999, // $29.99
  currency: 'USD',
  availability: 'in_stock',
  sourceUrl: 'fixture://products/prod_fixture_1',
  supplierId: 'mock',
  rawSourceMetadata: { fixture: true },
  confidence: [
    { field: 'title', score: 1.0, warnings: [] },
    { field: 'description', score: 0.7, warnings: ['Fixture data — not real content'] },
  ],
  importedAt: new Date().toISOString(),
  lastRefreshedAt: null,
};
