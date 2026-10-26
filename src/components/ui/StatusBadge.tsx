import type { ListingState } from '@/lib/types/canonical';
import { Chip as HeroUIChip } from '@heroui/react';

// TODO: @agent:forge (Stage 2) Apply color tokens for each status variant
// TODO: @agent:forge (Stage 2) Add icon per status (check, clock, warning, x)
// Reference: Blueprint §Stage 3 — listing state machine visualization

/** Maps listing states to human-readable labels */
const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  ready_for_review: 'Ready for Review',
  queued: 'Queued',
  submitted: 'Submitted',
  published: 'Published',
  failed: 'Failed',
};

export interface StatusBadgeProps {
  /** The current listing state */
  state: ListingState;
}

/**
 * StatusBadge — Stage 1 Stub
 * Displays the current listing state as a labeled badge.
 * Apply color tokens and icons in Stage 2.
 */
export function StatusBadge({ state }: StatusBadgeProps) {
  const badgeConfig: Record<string, { color: string; label: string }> = {
    draft: { color: 'default', label: STATE_LABELS.draft },
    ready_for_review: { color: 'success', label: STATE_LABELS.ready_for_review },
    queued: { color: 'primary', label: STATE_LABELS.queued },
    submitted: { color: 'primary', label: STATE_LABELS.submitted },
    published: { color: 'success', label: STATE_LABELS.published },
    failed: { color: 'danger', label: STATE_LABELS.failed },
  };

  const config = badgeConfig[state as string];

  return (
    <HeroUIChip color={config.color as any} variant="flat" size="sm">
      {config.label}
    </HeroUIChip>
  );
}
