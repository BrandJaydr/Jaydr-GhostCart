import type { ButtonHTMLAttributes } from 'react';

// TODO: @agent:forge (Stage 2) Implement full Button variants: primary, secondary, ghost, danger
// TODO: @agent:forge (Stage 2) Add loading spinner state and disabled visual treatment
// TODO: @agent:forge (Stage 2) Apply design system color tokens — not hardcoded values
// Reference: Production Blueprint §5.2 internal component layer

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant — determines color and emphasis */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Show loading spinner and disable interaction */
  isLoading?: boolean;
}

/**
 * Button — Stage 1 Stub
 * Renders a native <button> element. Implement styles and loading state in Stage 2.
 */
export function Button({ children, variant = 'primary', isLoading = false, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      data-variant={variant}
      aria-busy={isLoading}
      // TODO: @agent:forge Apply className from design tokens (not inline style)
    >
      {isLoading ? '...' : children}
    </button>
  );
}
