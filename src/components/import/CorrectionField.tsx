/**
 * CorrectionField — Stage 2 Scaffold
 *
 * Individual field correction component for product data. Displays the original
 * supplier value alongside an editable field for the merchant's correction.
 * Shows confidence scores and normalization warnings when available.
 *
 * Reference: Production Blueprint §6.2 (field-level confidence tracking)
 * @agent:forge Implement actual field editing and validation logic
 * @agent:forge Add design tokens and styling (Stage 2+)
 * @agent:forge Add confidence score visualization
 */

export interface CorrectionFieldProps {
  /** The field name being corrected (e.g., 'title', 'description', 'price') */
  fieldName: string;
  /** The original value from the supplier */
  originalValue: string;
  /** The current corrected value (if any) */
  correctedValue?: string;
  /** Confidence score for this field (0.0 - 1.0) */
  confidence?: number;
  /** Warnings from the normalization process */
  warnings?: string[];
  /** Callback when the field value changes */
  onChange: (value: string) => void;
  /** Callback when reverting to the original value */
  onRevert?: () => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Field type (text, textarea, number, etc.) */
  fieldType?: 'text' | 'textarea' | 'number';
}

/**
 * CorrectionField Component
 *
 * Displays a single editable field with:
 * - Original supplier value (read-only)
 * - Editable correction field
 * - Confidence score indicator
 * - Normalization warnings
 * - Revert to original button
 */
export function CorrectionField({
  fieldName,
  originalValue,
  correctedValue,
  confidence,
  warnings,
  onChange,
  onRevert,
  disabled = false,
  fieldType = 'text',
}: CorrectionFieldProps) {
  // TODO: @agent:forge Implement field editing logic
  // TODO: @agent:forge Add confidence score visualization (color-coded badge)
  // TODO: @agent:forge Add warning display with actionable messages
  // TODO: @agent:forge Add "Revert to Original" button when correctedValue exists
  // TODO: @agent:forge Add field-specific validation
  // TODO: @agent:forge Add design tokens and styling

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const hasCorrection = correctedValue !== undefined && correctedValue !== originalValue;
  const hasWarnings = warnings && warnings.length > 0;

  return (
    <div aria-label={`Correction field for ${fieldName}`}>
      <label htmlFor={`field-${fieldName}`}>
        {fieldName}
        {confidence !== undefined && (
          <span aria-label={`Confidence: ${Math.round(confidence * 100)}%`}>
            {' '}
            ({Math.round(confidence * 100)}% confidence)
          </span>
        )}
      </label>

      {/* Original value display */}
      <div aria-label="Original supplier value">
        <small>Original: {originalValue}</small>
      </div>

      {/* Editable correction field */}
      {fieldType === 'textarea' ? (
        <textarea
          id={`field-${fieldName}`}
          value={correctedValue ?? originalValue}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`Edit ${fieldName}`}
        />
      ) : (
        <input
          id={`field-${fieldName}`}
          type={fieldType === 'number' ? 'number' : 'text'}
          value={correctedValue ?? originalValue}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`Edit ${fieldName}`}
        />
      )}

      {/* Warnings display */}
      {hasWarnings && (
        <div aria-label="Normalization warnings" style={{ color: 'orange' }}>
          {warnings.map((warning, idx) => (
            <small key={idx}>⚠️ {warning}</small>
          ))}
        </div>
      )}

      {/* Revert button */}
      {hasCorrection && onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={disabled}
          aria-label={`Revert ${fieldName} to original value`}
        >
          Revert to Original
        </button>
      )}
    </div>
  );
}
