// TODO: @agent:forge (Stage 2) Add illustration or icon support
// Reference: Blueprint §5.3 — "Treat empty, loading, degraded, and failed states as first-class screens"

export interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional CTA element (e.g. <Button>) */
  action?: React.ReactNode;
}

/**
 * EmptyState — Stage 1 Stub
 * Used when a list or view has no content yet.
 * Every list screen must render this when data is empty (Blueprint §Stage 1).
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div role="status" aria-label={title}>
      {/* TODO: @agent:forge Add illustration / icon */}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
