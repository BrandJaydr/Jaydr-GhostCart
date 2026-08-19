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
  /** Label placement style */
  labelPlacement?: 'inside' | 'outside' | 'outside-left';
}

/**
 * Input — Hero UI implementation
 * Renders an input with label, error message, and helper text support.
 */
export function Input({
  label,
  labelPlacement = 'outside',
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
  const mergedClassNames = {
    label: `text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 ${rest.classNames?.label || ''}`,
    input: `text-sm ${rest.classNames?.input || ''}`,
    inputWrapper: `border-neutral-200 hover:border-neutral-400 focus-within:border-primary-500 dark:border-neutral-700 dark:hover:border-neutral-500 dark:focus-within:border-primary-400 ${rest.classNames?.inputWrapper || ''}`,
    ...(rest.classNames || {})
  };

  return (
    <HeroUIInput
      label={label}
      labelPlacement={labelPlacement}
      errorMessage={error}
      description={helperText}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      size={size}
      isDisabled={disabled}
      type={type}
      id={id}
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
  );
}
