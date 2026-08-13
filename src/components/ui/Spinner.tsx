import { Spinner as HeroUISpinner } from '@heroui/react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  return <HeroUISpinner size={size} color={color} />;
}
