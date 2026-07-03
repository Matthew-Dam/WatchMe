import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const starValue = value / 2

  const starSize =
    size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, starValue - i))

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={(e) => {
              if (readonly || !onChange) return
              const rect = e.currentTarget.getBoundingClientRect()
              const isLeft = e.clientX - rect.left < rect.width / 2
              const newVal = isLeft ? i * 2 + 1 : i * 2 + 2
              onChange(Math.min(10, Math.max(1, newVal)))
            }}
            className={cn(
              'relative transition-transform duration-150',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default',
            )}
          >
            <Star
              className={cn(
                starSize,
                'text-border transition-colors duration-150',
                fill > 0 && 'text-lime/30',
              )}
            />
            <div
              className="absolute inset-0 overflow-hidden transition-all duration-150"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={cn(starSize, 'fill-lime text-lime')} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
