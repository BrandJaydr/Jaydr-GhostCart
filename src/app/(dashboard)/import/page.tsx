import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Product',
};

/**
 * Import Form Screen — Stage 1 Stub
 *
 * Screen 2 of the thin vertical slice.
 * A signed-in merchant pastes a supplier product URL to begin the import workflow.
 *
 * Data flow (to be implemented):
 *   User input → POST /api/products → importQueue job → worker → normalized product
 *
 * TODO: @agent:forge Implement <ImportForm> component:
 *   - URL input field (required, validated)
 *   - Supplier selector (fixture list for Stage 1, real adapter list for Stage 2)
 *   - Submit button with loading/disabled state
 *   - Success state: redirect to /products/[id]/review
 *   - Error state: display <ErrorState> with actionable message
 *
 * TODO: @agent:atlas Wire POST /api/products API route to receive form submission
 * TODO: @agent:forge Add <EmptyState> for first-time merchant with no imports yet
 *
 * Blueprint reference: Stage 1 — "Build minimal app shell and four screens: sign-in, import form..."
 */
export default function ImportPage() {
  return (
    <main aria-label="Import a product">
      <h1>Import Product</h1>
      {/* TODO: @agent:forge Replace with <ImportForm /> */}
      <p style={{ color: 'gray' }}>[ImportForm placeholder — Stage 1 scaffold]</p>
    </main>
  );
}
