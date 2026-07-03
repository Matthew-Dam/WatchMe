import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isActive?: boolean
  className?: string
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16', text: 'text-lg' },
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({
  src,
  name,
  size = 'md',
  isActive = false,
  className,
}: AvatarProps) {
  const sz = sizeMap[size]

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover border-2 border-transparent',
            sz.container,
          )}
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const fallback = target.nextElementSibling
            if (fallback) {
              fallback.classList.remove('hidden')
            }
          }}
        />
      ) : null}
      <div
        className={cn(
          'rounded-full bg-cyan/20 border-2 border-cyan/30 flex items-center justify-center font-heading font-bold text-cyan',
          sz.container,
          sz.text,
          src ? 'hidden' : '',
        )}
      >
        {getInitials(name)}
      </div>
      {isActive && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-lime border-2 border-background rounded-full" />
      )}
    </div>
  )
}
