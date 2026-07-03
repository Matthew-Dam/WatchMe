import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'cyan' | 'magenta'
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'cyan',
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn(
        'animate-spin',
        size === 'sm' && 'w-4 h-4',
        size === 'md' && 'w-8 h-8',
        size === 'lg' && 'w-12 h-12',
        variant === 'cyan' && 'text-cyan',
        variant === 'magenta' && 'text-magenta',
        className,
      )}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
