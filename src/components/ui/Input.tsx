import type { InputHTMLAttributes } from 'react';

// TODO: @agent:forge (Stage 2) Implement full Input with label, error message, and helper text
// TODO: @agent:forge (Stage 2) Support controlled + uncontrolled usage patterns
// TODO: @agent:forge (Stage 2) Apply design system focus ring and error color tokens

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Accessible label text */
  label: string;
  /** Error message shown below input */
  error?: string;
  /** Helper text shown below input (hidden when error is present) */
  helperText?: string;
}

/**
 * Input — Stage 1 Stub
 * Renders a labeled <input> element. Implement full styling in Stage 2.
 */
export function Input({ label, error, helperText, id, ...props }: InputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />
      {/* TODO: @agent:forge Apply error/helper text styling */}
      {error && <p id={`${inputId}-error`} role="alert">{error}</p>}
      {!error && helperText && <p>{helperText}</p>}
    </div>
  );
}
