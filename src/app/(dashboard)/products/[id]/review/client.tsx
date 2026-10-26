'use client';

import { useState, useEffect } from 'react';
import { ProductCorrectionForm } from '@/components/import/ProductCorrectionForm';
import type { CanonicalProduct } from '@/lib/types/canonical';

interface ProductReviewClientProps {
  productId: string;
}

export function ProductReviewClient({ productId }: ProductReviewClientProps) {
  const [product, setProduct] = useState<CanonicalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCorrections, setSavingCorrections] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'pending_review' | 'approved' | 'rejected' | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProduct(data.data);
      setReviewStatus(data.data.reviewStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrections = async (corrections: Record<string, { original: string; corrected: string }>) => {
    try {
      setSavingCorrections(true);
      const response = await fetch(`/api/products/${productId}/corrections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corrections),
      });

      if (!response.ok) {
        throw new Error(`Failed to save corrections: ${response.statusText}`);
      }

      // Refresh product data after saving
      await fetchProduct();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save corrections');
    } finally {
      setSavingCorrections(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/review-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve product: ${response.statusText}`);
      }

      setReviewStatus('approved');
      await fetchProduct();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve product');
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/review-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject product: ${response.statusText}`);
      }

      setReviewStatus('rejected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject product');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error || 'Product not found'}</p>
        <button onClick={fetchProduct} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending_review': return 'orange';
      default: return 'gray';
    }
  };

  const completeness = product.normalizationCompleteness ?? 0;

  return (
    <main aria-label={`Review product ${productId}`} style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0 }}>
            Review Product
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              ID: {productId.slice(0, 8)}...
            </span>
            <span 
              style={{ 
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: `${getStatusColor(reviewStatus || 'pending_review')}20`,
                color: getStatusColor(reviewStatus || 'pending_review')
              }}
            >
              {reviewStatus?.replace('_', ' ').toUpperCase() || 'PENDING REVIEW'}
            </span>
          </div>
        </div>
        
        {/* Quality Metrics */}
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Data Completeness
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              {Math.round(completeness * 100)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Confidence Score
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              {Math.round((product.confidence?.reduce((acc, c) => acc + (c.score ?? 0), 0) / (product.confidence?.length || 1)) * 100)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Imported
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              {new Date(product.importedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Product Details
        </h2>
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#374151' }}>Title:</strong> {product.title}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#374151' }}>Description:</strong> {product.description || '(none)'}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#374151' }}>Price:</strong> ${(product.supplierPriceCents / 100).toFixed(2)} {product.currency}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#374151' }}>Availability:</strong> {product.availability.replace('_', ' ')}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: '#374151' }}>Source URL:</strong>{' '}
            <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
              {product.sourceUrl}
            </a>
          </div>
          {product.primaryImageUrl && (
            <div style={{ marginTop: '1rem' }}>
              <strong style={{ color: '#374151' }}>Primary Image:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <img 
                  src={product.primaryImageUrl} 
                  alt={product.title}
                  style={{ maxWidth: '200px', borderRadius: '0.375rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Correction Form */}
      <ProductCorrectionForm
        product={product}
        onSaveCorrections={handleSaveCorrections}
        isLoading={savingCorrections}
      />

      {/* Approval Actions */}
      {reviewStatus === 'pending_review' && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              Ready to use this product?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Approve to enable listing generation, or reject if this product is not suitable.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleReject}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                border: '1px solid #dc2626',
                borderRadius: '0.375rem',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#16a34a',
                border: 'none',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {reviewStatus === 'approved' && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#dcfce7',
          borderRadius: '0.5rem',
          border: '1px solid #16a34a',
          textAlign: 'center'
        }}>
          <p style={{ color: '#166534', fontWeight: '500', margin: 0 }}>
            ✓ This product has been approved and is ready for listing generation.
          </p>
        </div>
      )}

      {reviewStatus === 'rejected' && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#fee2e2',
          borderRadius: '0.5rem',
          border: '1px solid #dc2626',
          textAlign: 'center'
        }}>
          <p style={{ color: '#991b1b', fontWeight: '500', margin: 0 }}>
            ✗ This product has been rejected and cannot be used for listings.
          </p>
        </div>
      )}
    </main>
  );
}
