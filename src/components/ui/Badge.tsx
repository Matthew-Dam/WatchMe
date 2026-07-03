import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'cyan' | 'magenta' | 'lime' | 'outline'
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'cyan', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body whitespace-nowrap transition-colors duration-200',
        variant === 'cyan' && 'bg-cyan/10 text-cyan border border-cyan/20',
        variant === 'magenta' && 'bg-magenta/10 text-magenta border border-magenta/20',
        variant === 'lime' && 'bg-lime/10 text-lime border border-lime/20',
        variant === 'outline' && 'bg-transparent text-gray-400 border border-border',
        className,
      )}
    >
      {children}
    </span>
  )
}
