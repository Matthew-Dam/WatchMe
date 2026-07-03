import { Play, Plus, Check, Star } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Title } from '@/types'

interface HeroBannerProps {
  title: Title
  onPlay?: (title: Title) => void
  onAddToWatchlist?: (title: Title) => void
}

export function HeroBanner({
  title,
  onPlay,
  onAddToWatchlist,
}: HeroBannerProps) {
  const year = title.release_date
    ? new Date(title.release_date).getFullYear()
    : null

  return (
    <div className="relative w-full h-[80vh] min-h-[500px]">
      <div className="absolute inset-0">
        <img
          src={getImageUrl(title.backdrop_path, 'original')}
          alt={title.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 h-full flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 w-full">
          <div className="max-w-2xl">
            {title.logo_path ? (
              <img
                src={getImageUrl(title.logo_path)}
                alt={title.title}
                className="h-16 md:h-24 mb-4 object-contain object-left"
              />
            ) : (
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-3">
                {title.title}
              </h1>
            )}

            <div className="flex items-center gap-4 mb-4 text-sm text-gray-300 font-body flex-wrap">
              {year && <span>{year}</span>}
              {title.runtime && (
                <span>
                  {Math.floor(title.runtime / 60)}h {title.runtime % 60}m
                </span>
              )}
              {title.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <Star
                    size={14}
                    className="text-yellow-400 fill-yellow-400"
                  />
                  {title.vote_average.toFixed(1)}
                </span>
              )}
              {title.media_type && (
                <Badge variant="outline">
                  {title.media_type === 'movie' ? 'Movie' : 'TV Series'}
                </Badge>
              )}
            </div>

            {title.genres && title.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {title.genres.slice(0, 4).map((genre) => (
                  <Badge key={genre.id} variant="magenta">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {title.overview && (
              <p className="text-sm md:text-base text-gray-400 font-body line-clamp-3 mb-6 leading-relaxed">
                {title.overview}
              </p>
            )}

            {title.tagline && (
              <p className="text-sm italic text-cyan/70 font-body mb-4">
                &ldquo;{title.tagline}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onPlay?.(title)}
              >
                <Play size={18} fill="currentColor" />
                Play
              </Button>
              {onAddToWatchlist && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => onAddToWatchlist(title)}
                >
                  {title.in_watchlist ? (
                    <>
                      <Check size={18} /> In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Watchlist
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
