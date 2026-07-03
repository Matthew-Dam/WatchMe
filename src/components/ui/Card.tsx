import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: ReactNode
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ className, children, onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-xl transition-all duration-300',
        hoverable &&
          'cursor-pointer hover:border-cyan/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:-translate-y-0.5',
        onClick && !hoverable && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
