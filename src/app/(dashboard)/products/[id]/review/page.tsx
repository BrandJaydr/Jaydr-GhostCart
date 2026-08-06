import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Product',
};

interface ProductReviewPageProps {
  params: { id: string };
}

/**
 * Product Review Screen — Stage 1 Stub
 *
 * Screen 3 of the thin vertical slice.
 * Merchant reviews normalized product data and pricing before generating a listing draft.
 *
 * Data flow (to be implemented):
 *   GET /api/products/[id] → display CanonicalProduct fields + confidence/errors
 *
 * TODO: @agent:forge Implement <ProductReview> component:
 *   - Display: title, images, identifiers, price, availability, source URL, timestamp
 *   - Display: normalization confidence score and field-level errors (per Blueprint §6.2)
 *   - Action: "Edit field" inline correction (review-before-use state)
 *   - Action: "Generate Draft" CTA → POST /api/listings
 *   - Loading state, empty state, error state (if product not found)
 *
 * TODO: @agent:atlas Wire GET /api/products/[id] API route
 * TODO: @agent:forge Use fixture data (mock adapter) for Stage 1 rendering
 *
 * Blueprint reference: Stage 1 — "product review" screen with "fixture data and mock adapter"
 */
export default function ProductReviewPage({ params }: ProductReviewPageProps) {
  return (
    <main aria-label={`Review product ${params.id}`}>
      <h1>Review Product</h1>
      <p style={{ color: 'gray' }}>Product ID: {params.id}</p>
      {/* TODO: @agent:forge Replace with <ProductReview productId={params.id} /> */}
      <p style={{ color: 'gray' }}>[ProductReview placeholder — Stage 1 scaffold]</p>
    </main>
  );
}
