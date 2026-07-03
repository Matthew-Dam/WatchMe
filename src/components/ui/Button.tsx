import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-heading font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        size === 'sm' && 'px-3 py-1.5 text-xs gap-1.5',
        size === 'md' && 'px-5 py-2.5 text-sm gap-2',
        size === 'lg' && 'px-8 py-3.5 text-base gap-2.5',
        variant === 'primary' &&
          'bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 hover:border-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:-translate-y-0.5 active:translate-y-0',
        variant === 'secondary' &&
          'bg-magenta/10 text-magenta border border-magenta/30 hover:bg-magenta/20 hover:border-magenta/60 hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] hover:-translate-y-0.5 active:translate-y-0',
        variant === 'ghost' && 'text-gray-400 hover:text-white hover:bg-white/5',
        variant === 'outline' && 'bg-transparent text-gray-300 border border-border hover:border-cyan/50 hover:text-cyan',
        variant === 'danger' &&
          'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2
          className="animate-spin"
          size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
        />
      )}
      {children}
    </button>
  )
}
