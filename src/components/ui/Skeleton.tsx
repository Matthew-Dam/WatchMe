import { cn } from '@/lib/utils'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular'
  className?: string
  aspectRatio?: string
}

export function Skeleton({ variant = 'text', className, aspectRatio }: SkeletonProps) {
  return (
    <div
      className={cn(
        'shimmer-bg rounded',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'circular' && 'rounded-full aspect-square',
        variant === 'rectangular' && 'w-full',
        className,
      )}
      style={variant === 'rectangular' && aspectRatio ? { aspectRatio } : undefined}
    />
  )
}
