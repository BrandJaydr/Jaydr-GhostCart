/**
 * Canonical Domain Types — Jaydr GhostCart
 *
 * These are the internal canonical models that ALL adapters must normalize to.
 * External vendor payload shapes must NEVER leak into the application layer.
 * Reference: Production Blueprint §6.2 Adapter Contract
 *
 * @agent:archivist Refine field types as domain model matures through Stage 1→2
 * @agent:atlas Consume these types in API route handlers and service layer
 */

// ─── Product Domain ───────────────────────────────────────────────────────────

/** Listing state machine transitions (Blueprint §Stage 3) */
export type ListingState =
  | 'draft'
  | 'ready_for_review'
  | 'queued'
  | 'submitted'
  | 'published'
  | 'failed';

/** Normalization confidence for a specific field */
export interface FieldConfidence {
  field: string;
  score: number; // 0.0 – 1.0
  warnings: string[];
}

/** Canonical product model — normalized from any supplier adapter */
export interface CanonicalProduct {
  /** Internal GhostCart product ID (UUID) */
  id: string;
  /** Tenant that owns this product */
  tenantId: string;
  /** Human-readable product title */
  title: string;
  /** Long-form product description */
  description: string;
  /** Global Trade Item Numbers (GTIN, EAN, UPC, etc.) */
  identifiers: Record<string, string>;
  /** Primary image URL (must be a public, stable URL) */
  primaryImageUrl: string | null;
  /** Additional image URLs */
  additionalImageUrls: string[];
  /** Supplier's asking price in minor currency units (e.g. cents) */
  supplierPriceCents: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Stock availability as reported by supplier */
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  /** Original supplier product URL (for traceability) */
  sourceUrl: string;
  /** Supplier ID (references suppliers table) */
  supplierId: string;
  /** Raw supplier payload stored for traceability (never expose to clients) */
  rawSourceMetadata: Record<string, unknown>;
  /** Per-field normalization confidence scores */
  confidence: FieldConfidence[];
  /** ISO 8601 timestamp of when this product was imported */
  importedAt: string;
  /** ISO 8601 timestamp of last supplier data refresh */
  lastRefreshedAt: string | null;
}

// ─── Listing Domain ───────────────────────────────────────────────────────────

/** Canonical listing draft model */
export interface ListingDraft {
  /** Internal GhostCart listing ID (UUID) */
  id: string;
  /** Tenant that owns this listing */
  tenantId: string;
  /** The source product this listing was generated from */
  productId: string;
  /** Target marketplace identifier */
  marketplace: string;
  /** Current listing state machine state */
  state: ListingState;
  /** Merchant-editable listing title */
  title: string;
  /** Merchant-editable listing description */
  description: string;
  /** Marketplace-specific attributes (category, attributes map) */
  attributes: Record<string, unknown>;
  /** Listing price in minor currency units */
  listPriceCents: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Shipping configuration */
  shipping: Record<string, unknown>;
  /** Image URLs selected for this listing */
  imageUrls: string[];
  /** Idempotency key used for marketplace submission */
  idempotencyKey: string | null;
  /** External marketplace listing ID (populated after submission) */
  marketplaceListingId: string | null;
  /** Error detail if state is 'failed' */
  lastError: string | null;
  /** ISO 8601 timestamp of last state transition */
  updatedAt: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
}

// ─── Job Domain ───────────────────────────────────────────────────────────────

/** Job types handled by the worker process */
export type JobType = 'product.import' | 'product.refresh' | 'listing.submit';

export interface JobRecord {
  id: string;
  tenantId: string;
  type: JobType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastError: string | null;
  createdAt: string;
  completedAt: string | null;
}
