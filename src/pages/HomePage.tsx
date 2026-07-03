import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as catalog from '@/services/catalog'
import * as watchlistService from '@/services/watchlist'
import { useAuthStore } from '@/stores/authStore'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { Navbar } from '@/components/layout/Navbar'
import { HeroBanner } from '@/components/common/HeroBanner'
import { TitleRow } from '@/components/common/TitleRow'
import { GenreFilterBar } from '@/components/common/GenreFilterBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Title, Genre, WatchHistoryItem } from '@/types'

function RevealSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-[80vh] min-h-[500px] shimmer-bg" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 pb-16 -mt-16 relative z-20">
        {[1, 2, 3].map((row) => (
          <div key={row}>
            <Skeleton variant="text" className="w-48 h-5 mb-4" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  className="shrink-0 w-44"
                  aspectRatio="2/3"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4">
      <div className="w-24 h-24 rounded-full bg-surface-light border border-border/50 flex items-center justify-center mb-6">
        <span className="text-4xl font-heading font-bold text-gray-600">?</span>
      </div>
      <h2 className="text-2xl font-heading font-bold text-white mb-2">
        No content available yet
      </h2>
      <p className="text-gray-500 font-body text-sm max-w-md text-center">
        Content will appear here once it&apos;s added to the library. Check back
        soon!
      </p>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4">
      <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl">!</span>
      </div>
      <h2 className="text-2xl font-heading font-bold text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 font-body text-sm max-w-md text-center mb-6">
        {message}
      </p>
      <Button variant="primary" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const currentProfile = useAuthStore((s) => s.currentProfile)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featured, setFeatured] = useState<Title[]>([])
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>(
    [],
  )
  const [genres, setGenres] = useState<Genre[]>([])
  const [movieTitles, setMovieTitles] = useState<Title[]>([])
  const [showTitles, setShowTitles] = useState<Title[]>([])
  const [genreTitles, setGenreTitles] = useState<Record<string, Title[]>>({})
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [trailers, setTrailers] = useState<Title[]>([])
  const [upcoming, setUpcoming] = useState<Title[]>([])
  const [freeMovies, setFreeMovies] = useState<Title[]>([])
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    document.title = 'WatchMe'
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [
          featuredRes,
          continueRes,
          genresRes,
          moviesRes,
          showsRes,
        ] = await Promise.all([
          catalog.getFeatured(),
          catalog.getContinueWatching(currentProfile?.id),
          catalog.getGenres(),
          catalog.getTitles({
            content_type: 'movie',
            page_size: 20,
          }),
          catalog.getTitles({
            content_type: 'tv',
            page_size: 20,
          }),
        ])

        if (!mounted) return

        setFeatured(featuredRes)
        setContinueWatching(continueRes)
        setGenres(genresRes)
        setMovieTitles(moviesRes.items)
        setShowTitles(showsRes.items)

        const genrePromises = genresRes.map(async (genre) => {
          try {
            const res = await catalog.getTitles({
              genre: genre.name,
              page_size: 20,
            })
            return { genreId: genre.id, titles: res.items }
          } catch {
            return { genreId: genre.id, titles: [] }
          }
        })

        const genreResults = await Promise.all(genrePromises)
        if (!mounted) return

        const genreMap: Record<string, Title[]> = {}
        genreResults.forEach(({ genreId, titles }) => {
          genreMap[genreId] = titles
        })
        setGenreTitles(genreMap)

        const [trailersRes, upcomingRes, freeMoviesRes] = await Promise.all([
          catalog.getTitles({ has_trailer: true, page_size: 10 }),
          catalog.getTitles({ upcoming: true, sort_by: 'year', sort_order: 'asc', page_size: 10 }),
          catalog.getTitles({ category: 'Free', page_size: 10 }),
        ])

        if (!mounted) return

        setTrailers(trailersRes.items)
        setUpcoming(upcomingRes.items)
        setFreeMovies(freeMoviesRes.items)
      } catch (err) {
        if (!mounted) return
        const message =
          err instanceof Error ? err.message : 'Failed to load content'
        setError(message)
        toast.error(message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchAll()

    return () => {
      mounted = false
    }
  }, [retryCount])

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  const handlePlay = useCallback(
    (title: Title, progress?: number) => {
      navigate(`/watch/${title.id}`, {
        state: progress ? { resumeAt: progress } : undefined,
      })
    },
    [navigate],
  )

  const handleAddToWatchlist = useCallback(async (title: Title) => {
    try {
      if (title.in_watchlist) {
        await watchlistService.removeFromWatchlist(title.id)
      } else {
        await watchlistService.addToWatchlist(title.id)
      }
      setFeatured((prev) =>
        prev.map((t) =>
          t.id === title.id
            ? { ...t, in_watchlist: !t.in_watchlist }
            : t,
        ),
      )
    } catch {
      toast.error('Failed to update watchlist')
    }
  }, [])

  const genreNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    genres.forEach((g) => { map[g.id] = g.name })
    return map
  }, [genres])

  const selectedGenreName = selectedGenre ? genreNameMap[selectedGenre] || selectedGenre : null

  const filterByGenre = useCallback(
    (items: Title[]): Title[] => {
      if (!selectedGenreName) return items
      return items.filter((item) =>
        item.genres.some((g) => g.name === selectedGenreName),
      )
    },
    [selectedGenreName],
  )

  const rows = useMemo(() => {
    const result: Array<{
      key: string
      label: string
      items: Title[]
      onPlay: (title: Title) => void
    }> = []

    if (continueWatching.length > 0) {
      const items = filterByGenre(continueWatching.map((w) => w.title))
      if (items.length > 0) {
        result.push({
          key: 'continue',
          label: 'Continue Watching',
          items,
          onPlay: (title: Title) => {
            const item = continueWatching.find((w) => w.title.id === title.id)
            handlePlay(title, item?.progress)
          },
        })
      }
    }

    const trending = filterByGenre(featured)
    if (trending.length > 0) {
      result.push({
        key: 'trending',
        label: 'Trending Now',
        items: trending,
        onPlay: (title: Title) => handlePlay(title),
      })
    }

    const movies = filterByGenre(movieTitles)
    if (movies.length > 0) {
      result.push({
        key: 'movies',
        label: 'Popular Movies',
        items: movies,
        onPlay: (title: Title) => handlePlay(title),
      })
    }

    const shows = filterByGenre(showTitles)
    if (shows.length > 0) {
      result.push({
        key: 'shows',
        label: 'Popular Shows',
        items: shows,
        onPlay: (title: Title) => handlePlay(title),
      })
    }

    genres.forEach((genre) => {
      const titles = genreTitles[genre.id]
      if (titles?.length) {
        const filtered = filterByGenre(titles)
        if (filtered.length > 0) {
          result.push({
            key: `genre-${genre.id}`,
            label: genre.name,
            items: filtered,
            onPlay: (title: Title) => handlePlay(title),
          })
        }
      }
    })

    return result
  }, [
    featured,
    continueWatching,
    movieTitles,
    showTitles,
    genreTitles,
    genres,
    selectedGenre,
    filterByGenre,
    handlePlay,
  ])

  const heroTitle = featured[0] ?? null

  const hasContent = !loading && !error && rows.length === 0
  const hasError = !loading && error
  const showContent = !loading && !error && !hasContent

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        {loading && <LoadingSkeleton />}

        {hasError && <ErrorState message={error!} onRetry={handleRetry} />}

        {hasContent && <EmptyState />}

        {showContent && (
          <>
            {genres.length > 0 && (
              <GenreFilterBar
                genres={genres}
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
              />
            )}

            {heroTitle && (
              <RevealSection>
                <HeroBanner
                  title={heroTitle}
                  onPlay={(title) => handlePlay(title)}
                  onAddToWatchlist={handleAddToWatchlist}
                />
              </RevealSection>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-10 relative z-10">
              {rows.map((row) => (
                <RevealSection key={row.key}>
                  <TitleRow
                    title={row.label}
                    items={row.items}
                    onPlay={row.onPlay}
                  />
                </RevealSection>
              ))}

              {trailers.length > 0 && (
                <RevealSection>
                  <TitleRow
                    title="Latest Trailers"
                    items={trailers}
                    onPlay={(title: Title) => handlePlay(title)}
                  />
                </RevealSection>
              )}

              {upcoming.length > 0 && (
                <RevealSection>
                  <TitleRow
                    title="Coming Soon"
                    items={upcoming}
                    onPlay={(title: Title) => handlePlay(title)}
                  />
                </RevealSection>
              )}

              {freeMovies.length > 0 && (
                <RevealSection>
                  <TitleRow
                    title="Free Movies"
                    items={freeMovies}
                    onPlay={(title: Title) => handlePlay(title)}
                  />
                </RevealSection>
              )}
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  )
}
