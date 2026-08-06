// TODO: @agent:forge (Stage 2) Add retry action support and error code display
// TODO: @agent:forge (Stage 2) Integrate with structured error types from API responses
// Reference: Blueprint §5.3 — "Treat empty, loading, degraded, and failed states as first-class screens"

export interface ErrorStateProps {
  /** Short, actionable error title */
  title: string;
  /** Detailed error description or user-facing message */
  message?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Error code or correlation ID for support */
  errorCode?: string;
}

/**
 * ErrorState — Stage 1 Stub
 * Used when a request fails or an unexpected error occurs.
 * Must include an actionable message and optionally a retry control.
 */
export function ErrorState({ title, message, onRetry, errorCode }: ErrorStateProps) {
  return (
    <div role="alert" aria-label={title}>
      {/* TODO: @agent:forge Add error icon with accessible alt */}
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {errorCode && <code>Error: {errorCode}</code>}
      {onRetry && (
        <button type="button" onClick={onRetry}>
          {/* TODO: @agent:forge Replace with <Button variant="secondary"> */}
          Try Again
        </button>
      )}
    </div>
  );
}
