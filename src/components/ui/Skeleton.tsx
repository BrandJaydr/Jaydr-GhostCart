import { Skeleton as HeroUISkeleton } from '@heroui/react';

export type SkeletonShape = 'circle' | 'rectangle' | 'square'
export type SkeletonSize = 'sm' | 'md' | 'lg'

export interface SkeletonProps {
  shape?: SkeletonShape
  size?: SkeletonSize
  className?: string
  isLoaded?: boolean
  children?: React.ReactNode
}

export function Skeleton({ 
  shape = 'rectangle', 
  size = 'md',
  className,
  isLoaded = false,
  children 
}: SkeletonProps) {
  return (
    <HeroUISkeleton
      isLoaded={isLoaded}
      className={className}
    >
      {children}
    </HeroUISkeleton>
  );
}
