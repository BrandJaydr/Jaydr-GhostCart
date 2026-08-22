import { Button as HeroUIButton } from '@heroui/react';
import { motion } from 'framer-motion';
// Cast to any to avoid TypeScript incompatibility with HeroUIButton props
const MotionButton = motion(HeroUIButton) as any;
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
        return 'bg-primary-500 text-white font-semibold border border-border hover:border-2 hover:border-border dark:hover:border-white data-[disabled=true]:bg-border data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-100 disabled:bg-border disabled:text-muted-foreground disabled:opacity-100';
      case 'secondary':
        return 'bg-surface text-foreground font-medium border border-border hover:border-2 hover:border-border dark:hover:border-white data-[disabled=true]:opacity-60';
      case 'danger':
        return 'bg-danger text-white font-medium border border-border hover:border-2 hover:border-border dark:hover:border-white data-[disabled=true]:opacity-60';
      case 'ghost':
        return 'text-foreground border border-border hover:border-2 hover:border-border dark:hover:border-white data-[disabled=true]:opacity-60';
      default:
        return '';
    }
  };


  return (
    <MotionButton
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
      whileHover={size === 'sm' ? { rotate: 5 } : { scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </MotionButton>
  );
}
