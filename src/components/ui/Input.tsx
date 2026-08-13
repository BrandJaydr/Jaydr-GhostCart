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
}

/**
 * Input — Hero UI implementation
 * Renders an input with label, error message, and helper text support.
 */
export function Input({
  label,
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
  ...rest
}: InputProps) {
  return (
    <HeroUIInput
      label={label}
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
      {...rest}
    />
  );
}
