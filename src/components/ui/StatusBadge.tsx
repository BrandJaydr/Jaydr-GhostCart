import type { ListingState } from '@/lib/types/canonical';

// TODO: @agent:forge (Stage 2) Apply color tokens for each status variant
// TODO: @agent:forge (Stage 2) Add icon per status (check, clock, warning, x)
// Reference: Blueprint §Stage 3 — listing state machine visualization

/** Maps listing states to human-readable labels */
const STATE_LABELS: Record<ListingState, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for Review',
  queued: 'Queued',
  submitted: 'Submitted',
  published: 'Published',
  failed: 'Failed',
};

export interface StatusBadgeProps {
  /** The current listing state */
  status: ListingState;
}

/**
 * StatusBadge — Stage 1 Stub
 * Displays the current listing state as a labeled badge.
 * Apply color tokens and icons in Stage 2.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      data-status={status}
      // TODO: @agent:forge Apply className with design token color per status
    >
      {STATE_LABELS[status]}
    </span>
  );
}
