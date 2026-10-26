/**
 * ProductCorrectionForm — Stage 2 Implementation
 *
 * Form component for manual product corrections during the review-before-use workflow.
 * Allows merchants to override normalized supplier data while preserving original values
 * for traceability and audit purposes.
 *
 * Reference: Production Blueprint §6.2 (review-before-use state)
 */

'use client';

import { useState, useEffect } from 'react';
import { CorrectionField } from './CorrectionField';
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
  product,
  onSaveCorrections,
  onCancel,
  isLoading = false,
}: ProductCorrectionFormProps) {
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Extract field confidence and warnings from product confidence array
  const getFieldConfidence = (fieldName: string) => {
    const confidence = product.confidence?.find((c) => c.field === fieldName);
    return confidence?.score;
  };

  const getFieldWarnings = (fieldName: string) => {
    const confidence = product.confidence?.find((c) => c.field === fieldName);
    return confidence?.warnings;
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setCorrections((prev) => ({ ...prev, [fieldName]: value }));
    setHasChanges(true);
  };

  const handleFieldRevert = (fieldName: string) => {
    setCorrections((prev) => {
      const newCorrections = { ...prev };
      delete newCorrections[fieldName];
      return newCorrections;
    });
    setHasChanges(Object.keys(corrections).length > 1);
  };

  const handleSave = () => {
    const formattedCorrections: Record<string, { original: string; corrected: string }> = {};
    
    Object.entries(corrections).forEach(([field, correctedValue]) => {
      const originalValue = String(getOriginalValue(field));
      formattedCorrections[field] = {
        original: originalValue,
        corrected: correctedValue,
      };
    });

    onSaveCorrections(formattedCorrections);
  };

  const getOriginalValue = (fieldName: string): string => {
    switch (fieldName) {
      case 'title':
        return product.title;
      case 'description':
        return product.description;
      case 'supplier_price_cents':
        return String(product.supplierPriceCents);
      case 'currency':
        return product.currency;
      case 'availability':
        return product.availability;
      case 'primary_image_url':
        return product.primaryImageUrl || '';
      case 'additional_image_urls':
        return Array.isArray(product.additionalImageUrls) 
          ? product.additionalImageUrls.join(', ') 
          : '';
      case 'identifiers':
        return JSON.stringify(product.identifiers);
      default:
        return '';
    }
  };

  const getCurrentValue = (fieldName: string): string => {
    if (fieldName in corrections) {
      return corrections[fieldName];
    }
    return getOriginalValue(fieldName);
  };

  return (
    <div 
      aria-label="Product correction form"
      style={{ 
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Correct Product Data
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Review and correct the normalized product data below. Original values are preserved for audit purposes.
        </p>
      </div>

      {/* Editable Fields */}
      <div style={{ marginBottom: '2rem' }}>
        <CorrectionField
          fieldName="title"
          originalValue={product.title}
          correctedValue={corrections.title}
          confidence={getFieldConfidence('title')}
          warnings={getFieldWarnings('title')}
          onChange={(value) => handleFieldChange('title', value)}
          onRevert={() => handleFieldRevert('title')}
          disabled={isLoading}
          fieldType="text"
        />

        <CorrectionField
          fieldName="description"
          originalValue={product.description}
          correctedValue={corrections.description}
          confidence={getFieldConfidence('description')}
          warnings={getFieldWarnings('description')}
          onChange={(value) => handleFieldChange('description', value)}
          onRevert={() => handleFieldRevert('description')}
          disabled={isLoading}
          fieldType="textarea"
        />

        <CorrectionField
          fieldName="supplier_price_cents"
          originalValue={String(product.supplierPriceCents)}
          correctedValue={corrections.supplier_price_cents}
          confidence={getFieldConfidence('required')}
          warnings={getFieldWarnings('required')}
          onChange={(value) => handleFieldChange('supplier_price_cents', value)}
          onRevert={() => handleFieldRevert('supplier_price_cents')}
          disabled={isLoading}
          fieldType="number"
        />

        <CorrectionField
          fieldName="currency"
          originalValue={product.currency}
          correctedValue={corrections.currency}
          confidence={getFieldConfidence('required')}
          warnings={getFieldWarnings('required')}
          onChange={(value) => handleFieldChange('currency', value)}
          onRevert={() => handleFieldRevert('currency')}
          disabled={isLoading}
          fieldType="text"
        />

        <CorrectionField
          fieldName="availability"
          originalValue={product.availability}
          correctedValue={corrections.availability}
          confidence={getFieldConfidence('availability')}
          warnings={getFieldWarnings('availability')}
          onChange={(value) => handleFieldChange('availability', value)}
          onRevert={() => handleFieldRevert('availability')}
          disabled={isLoading}
          fieldType="text"
        />

        <CorrectionField
          fieldName="primary_image_url"
          originalValue={product.primaryImageUrl || ''}
          correctedValue={corrections.primary_image_url}
          confidence={getFieldConfidence('primary_image_url')}
          warnings={getFieldWarnings('primary_image_url')}
          onChange={(value) => handleFieldChange('primary_image_url', value)}
          onRevert={() => handleFieldRevert('primary_image_url')}
          disabled={isLoading}
          fieldType="text"
        />

        <CorrectionField
          fieldName="additional_image_urls"
          originalValue={
            Array.isArray(product.additionalImageUrls) 
              ? product.additionalImageUrls.join(', ') 
              : ''
          }
          correctedValue={corrections.additional_image_urls}
          confidence={getFieldConfidence('primary_image_url')}
          warnings={getFieldWarnings('primary_image_url')}
          onChange={(value) => handleFieldChange('additional_image_urls', value)}
          onRevert={() => handleFieldRevert('additional_image_urls')}
          disabled={isLoading}
          fieldType="text"
        />

        <CorrectionField
          fieldName="identifiers"
          originalValue={JSON.stringify(product.identifiers)}
          correctedValue={corrections.identifiers}
          confidence={getFieldConfidence('identifiers')}
          warnings={getFieldWarnings('identifiers')}
          onChange={(value) => handleFieldChange('identifiers', value)}
          onRevert={() => handleFieldRevert('identifiers')}
          disabled={isLoading}
          fieldType="textarea"
        />
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'flex-end',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#374151'
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          aria-busy={isLoading}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: hasChanges ? '#3b82f6' : '#9ca3af',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: (isLoading || !hasChanges) ? 'not-allowed' : 'pointer',
            color: 'white',
            fontWeight: '500'
          }}
        >
          {isLoading ? 'Saving...' : 'Save Corrections'}
        </button>
      </div>
    </div>
  );
}
