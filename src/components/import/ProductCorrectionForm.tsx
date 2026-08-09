/**
 * ProductCorrectionForm — Stage 2 Scaffold
 *
 * Form component for manual product corrections during the review-before-use workflow.
 * Allows merchants to override normalized supplier data while preserving original values
 * for traceability and audit purposes.
 *
 * Reference: Production Blueprint §6.2 (review-before-use state)
 * @agent:forge Implement actual correction logic and state management
 * @agent:forge Add design tokens and styling (Stage 2+)
 * @agent:atlas Wire correction persistence to API routes
 */

import type { CanonicalProduct } from '@/lib/types/canonical';

export interface ProductCorrectionFormProps {
  /** The product being reviewed and potentially corrected */
  product: CanonicalProduct;
  /** Callback when corrections are saved */
  onSaveCorrections: (corrections: Record<string, { original: string; corrected: string }>) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is currently in a loading state */
  isLoading?: boolean;
}

/**
 * ProductCorrectionForm Component
 *
 * Displays editable fields for product data with original values preserved.
 * Corrections are stored in the user_corrections JSONB column on the products table.
 *
 * Structure of corrections:
 * {
 *   fieldName: {
 *     original: string,
 *     corrected: string,
 *     correctedAt: string (ISO 8601),
 *     correctedBy: string (user ID)
 *   }
 * }
 */
export function ProductCorrectionForm({
  product: _product,
  onSaveCorrections: _onSaveCorrections,
  onCancel,
  isLoading = false,
}: ProductCorrectionFormProps) {
  // TODO: @agent:forge Implement form state management
  // TODO: @agent:forge Add field-specific correction components (CorrectionField)
  // TODO: @agent:forge Add validation for corrected values
  // TODO: @agent:forge Add confidence score display for each field
  // TODO: @agent:forge Add "Revert to Original" functionality per field
  // TODO: @agent:forge Add design tokens and styling

  const handleSave = () => {
    // TODO: @agent:forge Implement correction collection and persistence
    console.warn('[ProductCorrectionForm] Save not yet implemented');
  };

  return (
    <div aria-label="Product correction form">
      <h2>Correct Product Data</h2>
      <p style={{ color: 'gray' }}>
        [ProductCorrectionForm placeholder — Stage 2 scaffold]
      </p>
      {/* TODO: @agent:forge Add CorrectionField components for each editable field */}
      {/* Fields to include: title, description, price, availability, etc. */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Corrections'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
      )}
    </div>
  );
}
