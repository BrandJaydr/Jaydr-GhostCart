import type { CanonicalProduct } from '@/lib/types/canonical';

/**
 * ISupplierAdapter — Formal Adapter Contract
 *
 * ALL supplier adapters MUST implement this interface.
 * The application layer depends only on this interface — never on vendor payload shapes.
 *
 * Reference: Production Blueprint §6.2
 *
 * @agent:atlas Create concrete adapter implementations in Stage 2
 * @agent:atlas Register adapters in a factory by supplierId (never hard-code in components)
 */
export interface ISupplierAdapter {
  /** Unique identifier for this adapter (e.g. 'mock', 'csv', 'ebay-catalog') */
  readonly adapterId: string;

  /**
   * Validate that the adapter can connect to its data source.
   * Should NOT throw — return false with a reason on failure.
   */
  validateConnection(): Promise<{ valid: boolean; reason?: string }>;

  /**
   * Import a product by its supplier URL.
   * Must normalize all fields to CanonicalProduct shape.
   * Must store raw source metadata for traceability.
   */
  importProduct(url: string, tenantId: string): Promise<CanonicalProduct>;

  /**
   * Fetch a previously-imported product by its internal ID.
   * Used for refresh operations.
   */
  fetchProduct(productId: string, tenantId: string): Promise<CanonicalProduct>;
}
