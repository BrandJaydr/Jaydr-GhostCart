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
  className?: string;
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
  className = '',
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-500 text-white font-semibold hover:bg-primary-600 data-[disabled=true]:bg-border data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-100 disabled:bg-border disabled:text-muted-foreground disabled:opacity-100';
      case 'secondary':
        return 'bg-surface text-foreground font-medium border border-border hover:bg-border/50 data-[disabled=true]:opacity-60';
      case 'danger':
        return 'bg-danger text-white font-medium hover:bg-danger-600 data-[disabled=true]:opacity-60';
      case 'ghost':
        return 'text-foreground hover:bg-surface data-[disabled=true]:opacity-60';
      default:
        return '';
    }
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
      className={`${getVariantStyles()} ${className}`}
      {...rest}
    >
      {children}
    </HeroUIButton>
  );
}
