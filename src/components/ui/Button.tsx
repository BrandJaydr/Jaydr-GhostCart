import { Button as HeroUIButton } from '@heroui/react';
import type { ButtonProps as HeroUIButtonProps } from '@heroui/react';

export interface ButtonProps extends Omit<HeroUIButtonProps, 'color' | 'size' | 'onPress' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  name?: string;
  value?: string;
  form?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  name,
  value,
  form,
  ...rest
}: ButtonProps) {
  const colorMap = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'danger',
    ghost: 'default',
  };

  const variantMap = {
    primary: 'solid',
    secondary: 'solid',
    danger: 'solid',
    ghost: 'ghost',
  };

  return (
    <HeroUIButton
      color={colorMap[variant] as 'primary' | 'secondary' | 'danger' | 'default'}
      variant={variantMap[variant] as 'solid' | 'ghost'}
      size={size}
      isLoading={isLoading}
      isDisabled={disabled}
      onPress={onClick}
      type={type}
      name={name}
      value={value}
      form={form}
      {...rest}
    >
      {children}
    </HeroUIButton>
  );
}
