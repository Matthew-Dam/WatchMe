import { cn } from '@/lib/utils'
import type { Genre } from '@/types'

interface GenreRowProps {
  genres: Genre[]
  selected: string | null
  onSelect: (genreId: string | null) => void
}

export function GenreRow({ genres, selected, onSelect }: GenreRowProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all duration-200 border',
          selected === null
            ? 'bg-cyan text-background border-cyan'
            : 'bg-transparent text-gray-400 border-border hover:text-white hover:border-gray-500',
        )}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre.id}
          onClick={() => onSelect(genre.id === selected ? null : genre.id)}
          className={cn(
            'shrink-0 px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all duration-200 border',
            selected === genre.id
              ? 'bg-cyan/10 text-cyan border-cyan/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'bg-transparent text-gray-400 border-border hover:text-white hover:border-gray-500',
          )}
        >
          {genre.name}
        </button>
      ))}
    </div>
  )
}
