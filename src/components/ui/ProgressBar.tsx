import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  variant?: 'cyan' | 'magenta' | 'lime'
  showLabel?: boolean
  height?: number
  className?: string
}

export function ProgressBar({
  value,
  variant = 'cyan',
  showLabel = false,
  height = 6,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex-1 bg-surface-light rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variant === 'cyan' &&
              'bg-cyan shadow-[0_0_8px_rgba(0,240,255,0.5)]',
            variant === 'magenta' &&
              'bg-magenta shadow-[0_0_8px_rgba(255,45,149,0.5)]',
            variant === 'lime' &&
              'bg-lime shadow-[0_0_8px_rgba(198,255,61,0.5)]',
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 font-mono min-w-[3ch] text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  )
}
