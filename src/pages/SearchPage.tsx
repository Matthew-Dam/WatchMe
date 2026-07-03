import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X, ChevronDown, TrendingUp, Film, Tv, Calendar, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { search } from '@/services/search'
import { getGenres, getMoods, getTitles } from '@/services/catalog'
import { Navbar } from '@/components/layout/Navbar'
import { TitleCard } from '@/components/common/TitleCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SearchResult, Genre, MoodTag, Title } from '@/types'


type MediaType = '' | 'movie' | 'tv'
type SearchState = 'initial' | 'loading' | 'results' | 'empty' | 'error'

interface Filters {
  media_type: MediaType
  genre: string
  year: string
  mood: string
  has_trailer: string
}

const defaultFilters: Filters = {
  media_type: '',
  genre: '',
  year: '',
  mood: '',
  has_trailer: '',
}

const years = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i))

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    media_type: (searchParams.get('media_type') as MediaType) || '',
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    mood: searchParams.get('mood') || '',
  }))
  const [state, setState] = useState<SearchState>('initial')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [moods, setMoods] = useState<MoodTag[]>([])
  const [trending, setTrending] = useState<Title[]>([])
  const [popularMovies, setPopularMovies] = useState<Title[]>([])
  const [popularShows, setPopularShows] = useState<Title[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showMoodDropdown, setShowMoodDropdown] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLDivElement>(null)
  const moodRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 400)

  const hasActiveFilters = filters.media_type || filters.genre || filters.year || filters.mood || filters.has_trailer

  useEffect(() => {
    getGenres().then(setGenres).catch(() => {})
    getMoods().then(setMoods).catch(() => {})
    getTitles({ page_size: 12 }).then((r) => setTrending(r.items)).catch(() => {})
    getTitles({ page_size: 8, content_type: 'movie' }).then((r) => setPopularMovies(r.items)).catch(() => {})
    getTitles({ page_size: 8, content_type: 'tv' }).then((r) => setPopularShows(r.items)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('q', debouncedQuery)
    if (filters.media_type) params.set('media_type', filters.media_type)
    if (filters.genre) params.set('genre', filters.genre)
    if (filters.year) params.set('year', filters.year)
    if (filters.mood) params.set('mood', filters.mood)
    if (filters.has_trailer) params.set('has_trailer', 'true')
    setSearchParams(params, { replace: true })
  }, [debouncedQuery, filters, setSearchParams])

  useEffect(() => {
    if (!debouncedQuery && !hasActiveFilters) {
      setState('initial')
      setResults([])
      setSuggestions([])
      return
    }
    setState('loading')
    setPage(1)
    setHasMore(true)
    setError(null)

    const genreFilter = filters.genre || undefined
    const moodFilter = filters.mood || undefined
    const mediaTypeFilter = filters.media_type || undefined
    const yearFilter = filters.year ? Number(filters.year) : undefined
    const trailerFilter = filters.has_trailer ? true : undefined

    if (debouncedQuery) {
      search({
        query: debouncedQuery,
        page: 1,
        page_size: 20,
        genre: genreFilter,
        mood: moodFilter,
        content_type: mediaTypeFilter,
        year: yearFilter,
        has_trailer: trailerFilter,
      }).then((r) => {
        setResults(r.items)
        setTotal(r.total)
        setHasMore(r.page < r.pages)
        setState(r.items.length === 0 ? 'empty' : 'results')
      }).catch((err) => {
        setError(err?.message || 'Search failed')
        setState('error')
      })
    } else {
      getTitles({
        page: 1,
        page_size: 20,
        genre: genreFilter,
        mood: moodFilter,
        content_type: mediaTypeFilter,
        year: yearFilter,
        has_trailer: trailerFilter,
      }).then((r) => {
        setResults(r.items as unknown as SearchResult[])
        setTotal(r.total)
        setHasMore(r.page < r.pages)
        setState(r.items.length === 0 ? 'empty' : 'results')
      }).catch((err) => {
        setError(err?.message || 'Failed to load')
        setState('error')
      })
    }
  }, [debouncedQuery, filters])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(() => {
      search({ query: debouncedQuery, page: 1, page_size: 5 }).then((r) => {
        setSuggestions(r.items)
        setShowSuggestions(r.items.length > 0)
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedQuery])

  const loadMore = useCallback(async () => {
    if (!hasMore || state === 'loading') return
    const nextPage = page + 1
    setPage(nextPage)
    const genreFilter = filters.genre || undefined
    const moodFilter = filters.mood || undefined
    const mediaTypeFilter = filters.media_type || undefined
    const yearFilter = filters.year ? Number(filters.year) : undefined
    const trailerFilter = filters.has_trailer ? true : undefined

    try {
      if (debouncedQuery) {
        const r = await search({
          query: debouncedQuery,
          page: nextPage,
          page_size: 20,
          genre: genreFilter,
          mood: moodFilter,
          content_type: mediaTypeFilter,
          year: yearFilter,
          has_trailer: trailerFilter,
        })
        setResults((prev) => [...prev, ...r.items])
        setHasMore(r.page < r.pages)
      } else {
        const r = await getTitles({
          page: nextPage,
          page_size: 20,
          genre: genreFilter,
          mood: moodFilter,
          content_type: mediaTypeFilter,
          year: yearFilter,
          has_trailer: trailerFilter,
        })
        setResults((prev) => [...prev, ...(r.items as unknown as SearchResult[])])
        setHasMore(r.page < r.pages)
      }
    } catch {
      setHasMore(false)
    }
  }, [hasMore, state, page, debouncedQuery, filters])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && state === 'results') {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore, state])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setShowGenreDropdown(false)
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setShowYearDropdown(false)
      if (moodRef.current && !moodRef.current.contains(e.target as Node)) setShowMoodDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setShowGenreDropdown(false)
    setShowYearDropdown(false)
    setShowMoodDropdown(false)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setQuery('')
    inputRef.current?.focus()
  }

  const clearQuery = () => {
    setQuery('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false)
      } else if (query) {
        clearQuery()
      }
    }
    if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    }
    if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSuggestionIndex((prev) => Math.max(prev - 1, 0))
    }
    if (e.key === 'Enter' && showSuggestions && suggestionIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[suggestionIndex]
      if (selected) {
        navigate(`/title/${selected.id}`)
        setShowSuggestions(false)
      }
    }
  }

  const filterChips: { key: keyof Filters; label: string; value: string }[] = []
  if (filters.media_type) filterChips.push({ key: 'media_type', label: filters.media_type === 'movie' ? 'Movies' : 'TV Shows', value: filters.media_type })
  if (filters.genre) {
    const g = genres.find((g) => g.id === filters.genre)
    if (g) filterChips.push({ key: 'genre', label: g.name, value: filters.genre })
  }
  if (filters.year) filterChips.push({ key: 'year', label: filters.year, value: filters.year })
  if (filters.mood) {
    const m = moods.find((m) => m.id === filters.mood)
    if (m) filterChips.push({ key: 'mood', label: m.emoji ? `${m.emoji} ${m.name}` : m.name, value: filters.mood })
  }

  const mediaTypeOptions = [
    { value: '', label: 'All' },
    { value: 'movie', label: 'Movies' },
    { value: 'tv', label: 'TV Shows' },
  ] as const

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSuggestionIndex(-1)
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search movies, TV shows..."
              className={cn(
                'w-full bg-surface/80 border rounded-xl pl-12 pr-12 py-4 text-white font-body text-lg',
                'placeholder-gray-500 transition-all duration-300 outline-none backdrop-blur-sm',
                'focus:border-cyan/50 focus:shadow-[0_0_25px_rgba(0,240,255,0.2)]',
                'border-border',
              )}
            />
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 glass-darker rounded-xl overflow-hidden z-50 animate-fade-in shadow-2xl"
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    navigate(`/title/${s.id}`)
                    setShowSuggestions(false)
                  }}
                  onMouseEnter={() => setSuggestionIndex(i)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
                    i === suggestionIndex ? 'bg-cyan/10' : 'hover:bg-white/5',
                  )}
                >
                  {s.poster_path ? (
                    <img
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL || ''}/w92${s.poster_path}`}
                      alt=""
                      className="w-10 h-14 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 rounded bg-surface-light flex items-center justify-center shrink-0">
                      <Film size={16} className="text-gray-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate font-body">{s.title}</p>
                    <p className="text-xs text-gray-500 font-body">
                      {s.release_date ? new Date(s.release_date).getFullYear() : '—'}
                      {' · '}
                      {s.genres?.slice(0, 2).map((g) => g.name).join(', ')}
                      {' · '}
                      {s.media_type === 'movie' ? 'Movie' : 'TV'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-surface rounded-lg border border-border p-1">
            {mediaTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter('media_type', opt.value)}
                className={cn(
                  'px-4 py-2 text-sm font-body rounded-md transition-all duration-200',
                  filters.media_type === opt.value
                    ? 'bg-cyan/20 text-cyan font-semibold'
                    : 'text-gray-400 hover:text-white',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => updateFilter('has_trailer', filters.has_trailer ? '' : 'true')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-body rounded-lg border transition-all duration-200',
              filters.has_trailer
                ? 'bg-cyan/10 text-cyan border-cyan/30'
                : 'bg-surface text-gray-400 border-border hover:text-white hover:border-cyan/30',
            )}
          >
            <Film size={14} />
            Trailers
          </button>

          <div ref={genreRef} className="relative">
            <button
              onClick={() => { setShowGenreDropdown(!showGenreDropdown); setShowYearDropdown(false); setShowMoodDropdown(false) }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-body rounded-lg border transition-all duration-200',
                filters.genre
                  ? 'bg-cyan/10 text-cyan border-cyan/30'
                  : 'bg-surface text-gray-400 border-border hover:text-white hover:border-cyan/30',
              )}
            >
              {filters.genre ? genres.find((g) => g.id === filters.genre)?.name || 'Genre' : 'Genre'}
              <ChevronDown size={14} />
            </button>
            {showGenreDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 glass-darker rounded-xl overflow-hidden z-40 animate-fade-in shadow-2xl max-h-64 overflow-y-auto">
                <button
                  onClick={() => updateFilter('genre', '')}
                  className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:text-white hover:bg-white/5 font-body transition-colors"
                >
                  All Genres
                </button>
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => updateFilter('genre', g.id)}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left font-body transition-colors',
                      filters.genre === g.id
                        ? 'text-cyan bg-cyan/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={yearRef} className="relative">
            <button
              onClick={() => { setShowYearDropdown(!showYearDropdown); setShowGenreDropdown(false); setShowMoodDropdown(false) }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-body rounded-lg border transition-all duration-200',
                filters.year
                  ? 'bg-cyan/10 text-cyan border-cyan/30'
                  : 'bg-surface text-gray-400 border-border hover:text-white hover:border-cyan/30',
              )}
            >
              <Calendar size={14} />
              {filters.year || 'Year'}
              <ChevronDown size={14} />
            </button>
            {showYearDropdown && (
              <div className="absolute top-full left-0 mt-2 w-40 glass-darker rounded-xl overflow-hidden z-40 animate-fade-in shadow-2xl max-h-64 overflow-y-auto">
                <button
                  onClick={() => updateFilter('year', '')}
                  className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:text-white hover:bg-white/5 font-body transition-colors"
                >
                  All Years
                </button>
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => updateFilter('year', y)}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left font-body transition-colors',
                      filters.year === y
                        ? 'text-cyan bg-cyan/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={moodRef} className="relative">
            <button
              onClick={() => { setShowMoodDropdown(!showMoodDropdown); setShowGenreDropdown(false); setShowYearDropdown(false) }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-body rounded-lg border transition-all duration-200',
                filters.mood
                  ? 'bg-magenta/10 text-magenta border-magenta/30'
                  : 'bg-surface text-gray-400 border-border hover:text-white hover:border-magenta/30',
              )}
            >
              {filters.mood
                ? (() => { const m = moods.find((m) => m.id === filters.mood); return m?.emoji ? `${m.emoji} ${m.name}` : m?.name || 'Mood' })()
                : 'Mood'}
              <ChevronDown size={14} />
            </button>
            {showMoodDropdown && (
              <div className="absolute top-full left-0 mt-2 w-52 glass-darker rounded-xl overflow-hidden z-40 animate-fade-in shadow-2xl max-h-64 overflow-y-auto">
                <button
                  onClick={() => updateFilter('mood', '')}
                  className="w-full px-4 py-2.5 text-sm text-left text-gray-400 hover:text-white hover:bg-white/5 font-body transition-colors"
                >
                  All Moods
                </button>
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateFilter('mood', m.id)}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm text-left font-body transition-colors flex items-center gap-2',
                      filters.mood === m.id
                        ? 'text-magenta bg-magenta/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {m.emoji && <span>{m.emoji}</span>}
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-body bg-surface text-gray-400 border border-border rounded-lg hover:text-white transition-colors"
          >
            <Search size={14} />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-cyan transition-colors font-body underline underline-offset-4 ml-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {filterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {filterChips.map((chip) => (
              <Badge key={chip.key} variant={chip.key === 'mood' ? 'magenta' : 'cyan'}>
                <span className="flex items-center gap-1">
                  {chip.label}
                  <button
                    onClick={() => updateFilter(chip.key, '')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              </Badge>
            ))}
          </div>
        )}

        {showMobileFilters && (
          <div className="lg:hidden glass-darker rounded-xl p-4 mb-6 space-y-4 animate-fade-in">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-heading mb-2">Type</p>
              <div className="flex gap-2">
                {mediaTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateFilter('media_type', opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-body rounded-lg border transition-all',
                      filters.media_type === opt.value
                        ? 'bg-cyan/20 text-cyan border-cyan/30'
                        : 'bg-surface text-gray-400 border-border',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-heading mb-2">Genre</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('genre', '')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-body rounded-lg border transition-all',
                    !filters.genre ? 'bg-cyan/20 text-cyan border-cyan/30' : 'bg-surface text-gray-400 border-border',
                  )}
                >
                  All
                </button>
                {genres.slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => updateFilter('genre', g.id)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-body rounded-lg border transition-all',
                      filters.genre === g.id
                        ? 'bg-cyan/20 text-cyan border-cyan/30'
                        : 'bg-surface text-gray-400 border-border hover:text-white',
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-heading mb-2">Year</p>
              <select
                value={filters.year}
                onChange={(e) => updateFilter('year', e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white font-body focus:border-cyan/50 outline-none"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-heading mb-2">Mood</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('mood', '')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-body rounded-lg border transition-all',
                    !filters.mood ? 'bg-magenta/20 text-magenta border-magenta/30' : 'bg-surface text-gray-400 border-border',
                  )}
                >
                  All
                </button>
                {moods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateFilter('mood', m.id)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-body rounded-lg border transition-all',
                      filters.mood === m.id
                        ? 'bg-magenta/20 text-magenta border-magenta/30'
                        : 'bg-surface text-gray-400 border-border hover:text-white',
                    )}
                  >
                    {m.emoji && <span className="mr-1">{m.emoji}</span>}
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === 'initial' && (
          <div className="space-y-10">
            {trending.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp size={20} className="text-cyan" />
                  <h2 className="text-xl font-heading font-bold text-white">Trending Now</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trending.map((t) => (
                    <button key={t.id} onClick={() => navigate(`/title/${t.id}`)} className="text-left">
                      <TitleCard title={t} size="sm" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {popularMovies.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <Film size={18} className="text-cyan" />
                    <h2 className="text-lg font-heading font-bold text-white">Popular Movies</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3">
                    {popularMovies.map((t) => (
                      <button key={t.id} onClick={() => navigate(`/title/${t.id}`)} className="text-left">
                        <TitleCard title={t} size="sm" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {popularShows.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5">
                    <Tv size={18} className="text-magenta" />
                    <h2 className="text-lg font-heading font-bold text-white">Popular TV Shows</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3">
                    {popularShows.map((t) => (
                      <button key={t.id} onClick={() => navigate(`/title/${t.id}`)} className="text-left">
                        <TitleCard title={t} size="sm" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div>
            {debouncedQuery && (
              <p className="text-sm text-gray-500 font-body mb-4">
                <LoadingSpinner size="sm" /> Searching for &ldquo;{debouncedQuery}&rdquo;&hellip;
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton variant="rectangular" aspectRatio="2/3" className="rounded-xl" />
                  <Skeleton variant="text" className="w-3/4 h-3" />
                  <Skeleton variant="text" className="w-1/2 h-3" />
                </div>
              ))}
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <X size={28} className="text-red-400" />
            </div>
            <p className="text-lg text-gray-300 font-body mb-2">Something went wrong</p>
            <p className="text-sm text-gray-500 font-body mb-6">{error}</p>
            <Button variant="outline" onClick={() => {
              setFilters((prev) => ({ ...prev }))
              setState('loading')
            }}>
              Try Again
            </Button>
          </div>
        )}

        {state === 'results' && (
          <div>
            <p className="text-sm text-gray-400 font-body mb-5">
              Showing {total} result{total !== 1 ? 's' : ''}
              {debouncedQuery && (
                <> for &ldquo;<span className="text-white">{debouncedQuery}</span>&rdquo;</>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((item) => (
                <button key={item.id} onClick={() => navigate(`/title/${item.id}`)} className="text-left">
                  <TitleCard
                    title={{
                      ...item,
                      original_title: item.original_title,
                      backdrop_path: item.backdrop_path,
                      runtime: null,
                      status: null,
                      tagline: null,
                      vote_count: 0,
                      popularity: item.popularity,
                      seasons: [],
                      episodes: [],
                      category: null,
                      countries: [],
                      mood_tags: [],
                      rating_summary: null,
                      user_rating: null,
                      in_watchlist: false,
                      watch_progress: null,
                      created_at: '',
                      updated_at: '',
                      tmdb_id: null,
                      logo_path: null,
                    } as Title}
                    size="sm"
                  />
                </button>
              ))}
            </div>

            <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
              {hasMore && <LoadingSpinner size="sm" />}
              {!hasMore && results.length > 0 && (
                <p className="text-sm text-gray-600 font-body">You&rsquo;ve reached the end</p>
              )}
            </div>
          </div>
        )}

        {state === 'empty' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4">
              <Search size={28} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-heading font-bold text-white mb-2">No results found</h3>
            {debouncedQuery && (
              <p className="text-gray-400 font-body mb-1">
                No results for &ldquo;<span className="text-white">{debouncedQuery}</span>&rdquo;
              </p>
            )}
            <p className="text-sm text-gray-500 font-body mb-8">
              Try different keywords, adjust filters, or browse popular titles below
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>

            {trending.length > 0 && (
              <div className="w-full mt-12">
                <div className="flex items-center gap-2 mb-5">
                  <Star size={18} className="text-cyan" />
                  <h3 className="text-lg font-heading font-bold text-white">Popular Titles</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trending.slice(0, 6).map((t) => (
                    <button key={t.id} onClick={() => navigate(`/title/${t.id}`)} className="text-left">
                      <TitleCard title={t} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
