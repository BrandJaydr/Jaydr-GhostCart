import { Input as HeroUIInput } from '@heroui/react';
import type { InputProps as HeroUIInputProps } from '@heroui/react';

export interface InputProps extends Omit<HeroUIInputProps, 'label' | 'errorMessage' | 'description' | 'isInvalid'> {
  /** Accessible label text */
  label?: string;
  /** Error message shown below input */
  error?: string;
  /** Helper text shown below input (hidden when error is present) */
  helperText?: string;
  /** Input value for controlled usage */
  value?: string
  /** Input change handler for controlled usage */
  onValueChange?: (value: string) => void
  /** Input placeholder */
  placeholder?: string
  /** Input size */
  size?: 'sm' | 'md' | 'lg'
  /** Disable the input */
  disabled?: boolean
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number'
  /** Input ID */
  id?: string
  /** Form name attribute */
  name?: string
  /** Required field */
  required?: boolean
  /** Autocomplete attribute */
  autoComplete?: string
  /** Minimum value (for number inputs) */
  min?: number | string
  /** Maximum value (for number inputs) */
  max?: number | string
  /** Step value (for number inputs) */
  step?: number | string
  /** Form attribute */
  form?: string
  /** Label placement style — kept for API compatibility, label always renders above */
  labelPlacement?: 'inside' | 'outside' | 'outside-left';
}

/**
 * Input — Hero UI implementation
 * Renders a label as a native <label> element above the HeroUI input to
 * guarantee the label never overlaps with the placeholder, regardless of
 * HeroUI's internal label placement behaviour.
 */
export function Input({
  label,
  labelPlacement: _labelPlacement,
  error,
  helperText,
  value,
  onValueChange,
  placeholder,
  size = 'md',
  disabled = false,
  type = 'text',
  id,
  name,
  required,
  autoComplete,
  min,
  max,
  step,
  form,
  variant = 'bordered',
  ...rest
}: InputProps) {
  // Derive a stable id for the label htmlFor if none was provided
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const mergedClassNames = {
    input: `text-sm ${rest.classNames?.input || ''}`,
    inputWrapper: `border-border bg-surface hover:border-2 hover:border-border focus-within:border-2 focus-within:border-border dark:hover:border-white dark:focus-within:border-white ${rest.classNames?.inputWrapper || ''}`,
    ...(rest.classNames || {}),
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-400"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <HeroUIInput
        label={undefined}
        labelPlacement="outside"
        errorMessage={error}
        description={helperText}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        size={size}
        isDisabled={disabled}
        type={type}
        id={inputId}
        isInvalid={!!error}
        name={name}
        isRequired={required}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        form={form}
        variant={variant}
        classNames={mergedClassNames}
        {...rest}
      />
    </div>
  );
}
