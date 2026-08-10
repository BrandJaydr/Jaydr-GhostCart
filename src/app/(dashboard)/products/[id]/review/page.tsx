import type { Metadata } from 'next';
import { ProductReviewClient } from './client';

export const metadata: Metadata = {
  title: 'Review Product',
};

interface ProductReviewPageProps {
  params: { id: string };
}

/**
 * Product Review Screen — Stage 2 Implementation
 *
 * Screen 3 of the thin vertical slice.
 * Merchant reviews normalized product data and pricing before generating a listing draft.
 *
 * Data flow:
 *   GET /api/products/[id] → display CanonicalProduct fields + confidence/errors
 *   PATCH /api/products/[id]/corrections → save manual corrections
 *   PATCH /api/products/[id]/review-status → approve/reject product
 *
 * Reference: Production Blueprint §6.2 (review-before-use state)
 */
export default function ProductReviewPage({ params }: ProductReviewPageProps) {
  return <ProductReviewClient productId={params.id} />;
}
