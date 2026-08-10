/**
 * CorrectionField — Stage 2 Implementation
 *
 * Individual field correction component for product data. Displays the original
 * supplier value alongside an editable field for the merchant's correction.
 * Shows confidence scores and normalization warnings when available.
 *
 * Reference: Production Blueprint §6.2 (field-level confidence tracking)
 */

'use client';

import { useState } from 'react';

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
  const [localValue, setLocalValue] = useState(correctedValue ?? originalValue);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsDirty(newValue !== originalValue);
    onChange(newValue);
  };

  const handleRevert = () => {
    setLocalValue(originalValue);
    setIsDirty(false);
    onRevert?.();
  };

  const hasCorrection = isDirty || (correctedValue !== undefined && correctedValue !== originalValue);
  const hasWarnings = warnings && warnings.length > 0;

  const getConfidenceColor = (score?: number) => {
    if (score === undefined) return 'gray';
    if (score >= 0.8) return 'green';
    if (score >= 0.5) return 'orange';
    return 'red';
  };

  const confidenceColor = getConfidenceColor(confidence);

  return (
    <div 
      aria-label={`Correction field for ${fieldName}`}
      style={{ 
        marginBottom: '1.5rem',
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        backgroundColor: isDirty ? '#fefce8' : 'white'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label 
          htmlFor={`field-${fieldName}`}
          style={{ 
            fontWeight: '600',
            fontSize: '0.875rem',
            color: '#374151'
          }}
        >
          {fieldName}
        </label>
        {confidence !== undefined && (
          <span 
            aria-label={`Confidence: ${Math.round(confidence * 100)}%`}
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: `${confidenceColor}20`,
              color: confidenceColor,
              fontWeight: '500'
            }}
          >
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Original value display */}
      <div 
        aria-label="Original supplier value"
        style={{ 
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          color: '#6b7280'
        }}
      >
        <strong>Original:</strong> {originalValue || '(empty)'}
      </div>

      {/* Editable correction field */}
      {fieldType === 'textarea' ? (
        <textarea
          id={`field-${fieldName}`}
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`Edit ${fieldName}`}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontFamily: 'inherit'
          }}
        />
      ) : (
        <input
          id={`field-${fieldName}`}
          type={fieldType === 'number' ? 'number' : 'text'}
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`Edit ${fieldName}`}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem'
          }}
        />
      )}

      {/* Warnings display */}
      {hasWarnings && (
        <div 
          aria-label="Normalization warnings"
          style={{ 
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '0.375rem'
          }}
        >
          {warnings.map((warning, idx) => (
            <div 
              key={idx} 
              style={{ 
                fontSize: '0.75rem',
                color: '#c2410c',
                marginBottom: idx < warnings.length - 1 ? '0.25rem' : '0'
              }}
            >
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Revert button */}
      {hasCorrection && onRevert && (
        <button
          type="button"
          onClick={handleRevert}
          disabled={disabled}
          aria-label={`Revert ${fieldName} to original value`}
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: '#374151'
          }}
        >
          Revert to Original
        </button>
      )}
    </div>
  );
}
