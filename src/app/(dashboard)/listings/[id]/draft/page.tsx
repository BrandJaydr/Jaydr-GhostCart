import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listing Draft',
};

interface ListingDraftPageProps {
  params: { id: string };
}

/**
 * Listing Draft Screen — Stage 1 Stub
 *
 * Screen 4 of the thin vertical slice (the terminal deliverable of Stage 1).
 * Merchant edits the AI-generated listing draft before export or submission.
 *
 * Data flow (to be implemented):
 *   GET /api/listings/[id] → display ListingDraft fields
 *   PUT /api/listings/[id] → persist merchant edits
 *   POST /api/listings/[id]/submit → queue for marketplace submission (Stage 3+)
 *
 * TODO: @agent:forge Implement <ListingDraft> component:
 *   - Editable fields: title, description, attributes, images, price, shipping
 *   - "AI-generated" badge with original source content preserved (Blueprint §Stage 3)
 *   - State indicator: draft | ready_for_review | queued | submitted | published | failed
 *   - Action: "Save Draft" (PUT)
 *   - Action: "Export / Submit" (Stage 3 — placeholder for Stage 1)
 *   - Loading, empty, and error states
 *
 * TODO: @agent:atlas Wire GET/PUT /api/listings/[id] routes
 * TODO: @agent:forge Add activity history panel (audit log display) — Stage 3+
 *
 * Blueprint reference: Stage 1 — "listing draft" screen; Stage 3 — listing state machine
 */
export default function ListingDraftPage({ params }: ListingDraftPageProps) {
  return (
    <main aria-label={`Listing draft ${params.id}`}>
      <h1>Listing Draft</h1>
      <p style={{ color: 'gray' }}>Listing ID: {params.id}</p>
      {/* TODO: @agent:forge Replace with <ListingDraft listingId={params.id} /> */}
      <p style={{ color: 'gray' }}>[ListingDraft placeholder — Stage 1 scaffold]</p>
    </main>
  );
}
