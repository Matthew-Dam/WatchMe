import { useRef } from 'react'
import { cn } from '@/lib/utils'
import type { Genre } from '@/types'

interface GenreFilterBarProps {
  genres: Genre[]
  selectedGenre: string | null
  onSelectGenre: (genreId: string | null) => void
}

export function GenreFilterBar({
  genres,
  selectedGenre,
  onSelectGenre,
}: GenreFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSelect = (genreId: string | null) => {
    onSelectGenre(genreId)
    const chip = scrollRef.current?.querySelector(
      `[data-id="${genreId ?? 'all'}"]`,
    )
    chip?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scroll-smooth py-3"
        >
          <button
            data-id="all"
            onClick={() => handleSelect(null)}
            className={cn(
              'shrink-0 px-5 py-2 rounded-full text-sm font-heading font-semibold uppercase tracking-wider transition-all duration-300 border',
              selectedGenre === null
                ? 'bg-cyan/20 text-cyan border-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-surface-light/50 text-gray-400 border-border/50 hover:text-white hover:border-gray-500 hover:bg-surface-light',
            )}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              data-id={genre.id}
              onClick={() =>
                handleSelect(genre.id === selectedGenre ? null : genre.id)
              }
              className={cn(
                'shrink-0 px-5 py-2 rounded-full text-sm font-heading font-semibold uppercase tracking-wider transition-all duration-300 border',
                selectedGenre === genre.id
                  ? 'bg-cyan/20 text-cyan border-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'bg-surface-light/50 text-gray-400 border-border/50 hover:text-white hover:border-gray-500 hover:bg-surface-light',
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
