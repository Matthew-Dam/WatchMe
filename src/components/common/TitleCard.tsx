import { useState } from 'react'
import { Play, Plus, Check, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/utils'
import type { Title } from '@/types'

interface TitleCardProps {
  title: Title
  onPlay?: (title: Title) => void
  onAddToWatchlist?: (title: Title) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { card: 'w-36', title: 'text-xs' },
  md: { card: 'w-44', title: 'text-sm' },
  lg: { card: 'w-56', title: 'text-sm' },
}

export function TitleCard({
  title,
  onPlay,
  onAddToWatchlist,
  size = 'md',
}: TitleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const sizes = sizeClasses[size]

  const year = title.release_date
    ? new Date(title.release_date).getFullYear()
    : null

  return (
    <div className={cn('group shrink-0', sizes.card)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl mb-2 aspect-[2/3]',
          'border border-border/30 group-hover:border-cyan/40',
          'transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]',
          'group-hover:-translate-y-1',
        )}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 shimmer-bg" />
        )}
        <img
          src={getImageUrl(title.poster_path, 'w342')}
          alt={title.title}
          loading="lazy"
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            'group-hover:scale-105',
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <span className="text-4xl font-heading font-bold text-gray-600">
              {title.title.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="space-y-2">
            {onPlay && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPlay(title)
                }}
                className="flex items-center justify-center w-full py-2 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan text-xs font-heading font-semibold uppercase tracking-wider hover:bg-cyan/30 transition-colors"
              >
                <Play size={14} className="mr-1.5" fill="currentColor" />
                Play
              </button>
            )}
            {onAddToWatchlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToWatchlist(title)
                }}
                className="flex items-center justify-center w-full py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-heading font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                {title.in_watchlist ? (
                  <>
                    <Check size={14} className="mr-1.5" /> In List
                  </>
                ) : (
                  <>
                    <Plus size={14} className="mr-1.5" /> Watchlist
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {title.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white font-body">
              {title.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="px-0.5">
        <h3
          className={cn(
            'font-body font-medium text-white truncate',
            sizes.title,
          )}
        >
          {title.title}
        </h3>
        {year && (
          <p className="text-xs text-gray-500 font-body mt-0.5">{year}</p>
        )}
      </div>
    </div>
  )
}
