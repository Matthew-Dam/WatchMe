import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Play,
  Plus,
  Check,
  MessageCircle,
  ChevronDown,
  Users,
  Clock,
  Eye,
} from 'lucide-react'
import * as catalog from '@/services/catalog'
import * as ratings from '@/services/ratings'
import * as watchlistService from '@/services/watchlist'
import * as commentsService from '@/services/comments'
import api from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { getImageUrl, formatDuration, formatDate } from '@/lib/utils'
import type { Title, Comment, RatingSummary } from '@/types'

interface CastMember {
  id: string
  name: string
  character: string
  avatar_url: string | null
}

interface AbandonData {
  percentage: number
  minute: number
}

function getYear(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.split('-')[0] || ''
}

function getContentRating(title: Title): string {
  const genres = title.genres.map((g) => g.name.toLowerCase())
  if (genres.includes('horror') || genres.includes('thriller')) return '18+'
  if (genres.includes('action') || genres.includes('crime')) return '16+'
  return '13+'
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[70vh] bg-surface">
        <Skeleton variant="rectangular" className="h-full" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <Skeleton variant="text" className="h-12 w-96" />
            <div className="flex gap-3">
              <Skeleton variant="text" className="h-6 w-16" />
              <Skeleton variant="text" className="h-6 w-20" />
              <Skeleton variant="text" className="h-6 w-14" />
            </div>
            <Skeleton variant="text" className="h-5 w-[600px]" />
            <Skeleton variant="text" className="h-5 w-[500px]" />
            <div className="flex gap-4">
              <Skeleton variant="rectangular" className="h-12 w-36 rounded-lg" />
              <Skeleton variant="rectangular" className="h-12 w-44 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <Skeleton variant="rectangular" className="h-48 rounded-xl" />
        <Skeleton variant="rectangular" className="h-64 rounded-xl" />
        <Skeleton variant="rectangular" className="h-40 rounded-xl" />
      </div>
    </div>
  )
}

function ErrorState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-6xl font-heading font-bold text-border">404</div>
        <h1 className="text-3xl font-heading text-white">Title Not Found</h1>
        <p className="text-gray-400 font-body leading-relaxed">
          This title doesn't exist in our catalog or may have been removed.
        </p>
        <Button variant="primary" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  )
}

export default function TitleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()


  const [title, setTitle] = useState<Title | null>(null)
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [cast, setCast] = useState<CastMember[]>([])
  const [abandonData, setAbandonData] = useState<AbandonData | null>(null)
  const [recommended, setRecommended] = useState<Title[]>([])
  const [topComments, setTopComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isRating, setIsRating] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setIsLoading(true)
    setIsError(false)

    async function fetchData() {
      try {
        if (!id) return
        const titleData = await catalog.getTitle(id)
        if (cancelled) return
        setTitle(titleData)
        setIsInWatchlist(titleData.in_watchlist)
        setUserRating(titleData.user_rating ?? titleData.rating_summary?.user_rating ?? null)

        setRatingSummary(titleData.rating_summary)

        const episodeList = titleData.episodes || []
        if (episodeList.length > 0) {
          const seasons = [...new Set(episodeList.map((e) => e.season_number))].sort(
            (a, b) => a - b,
          )
          setSelectedSeason(seasons[0] || 1)
        }

        if (titleData.genres.length > 0) {
          const recRes = await catalog.getTitles({
            genre: titleData.genres[0].name,
            page_size: 10,
          })
          if (!cancelled) {
            setRecommended(recRes.items.filter((t) => t.id !== titleData.id).slice(0, 8))
          }
        }

        try {
          const { data: creditsData } = await api.get<{
            cast: CastMember[]
          }>(`/titles/${id}/credits`)
          if (!cancelled && creditsData?.cast) {
            setCast(creditsData.cast.slice(0, 12))
          }
        } catch {
          // Cast data may not be available
        }

        try {
          const { data: abandon } = await api.get<AbandonData>(
            `/titles/${id}/analytics/abandon`,
          )
          if (!cancelled && abandon) {
            setAbandonData(abandon)
          }
        } catch {
          // Abandon data may not be available
        }

        try {
          if (id) {
            const commentsRes = await commentsService.getComments(id, {
              page_size: 3,
            })
            if (!cancelled) {
              setTopComments(commentsRes.items)
            }
          }
        } catch {
          // Comments may not be available
        }
      } catch {
        if (!cancelled) setIsError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [id])

  const episodes = useMemo(() => {
    if (!title?.episodes) return []
    return title.episodes.filter((e) => e.season_number === selectedSeason)
  }, [title?.episodes, selectedSeason])

  const seasons = useMemo(() => {
    if (!title?.episodes || title.episodes.length === 0) return [1]
    return [...new Set(title.episodes.map((e) => e.season_number))].sort((a, b) => a - b)
  }, [title?.episodes])

  const handleToggleWatchlist = async () => {
    if (!id) return
    setIsTogglingWatchlist(true)
    try {
      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(id)
        setIsInWatchlist(false)
      } else {
        await watchlistService.addToWatchlist(id)
        setIsInWatchlist(true)
      }
    } catch {
      // silently fail
    } finally {
      setIsTogglingWatchlist(false)
    }
  }

  const handleRate = async (rating: number) => {
    if (!id) return
    setIsRating(true)
    try {
      await ratings.rateTitle(id, { rating })
      setUserRating(rating)
      setRatingSummary((prev) => {
        if (!prev) return prev
        const dist = { ...prev.distribution }
        dist[rating] = (dist[rating] || 0) + 1
        const newCount = prev.count + 1
        const newAvg = (prev.average * prev.count + rating) / newCount
        return { ...prev, average: newAvg, count: newCount, distribution: dist }
      })
    } catch {
      // silently fail
    } finally {
      setIsRating(false)
    }
  }

  const handleBack = () => navigate(-1)

  const handlePlay = () => {
    if (id) navigate(`/watch/${id}`)
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError || !title) return <ErrorState onBack={handleBack} />

  const posterUrl = getImageUrl(title.poster_path, 'w500')
  const backdropUrl = getImageUrl(title.backdrop_path, 'original')
  const contentRating = getContentRating(title)
  const isShow = title.media_type === 'tv'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        {/* Backdrop image */}
        <div
          className="absolute inset-0 h-[80vh] bg-cover bg-center"
          style={{
            backgroundImage: `url(${backdropUrl})`,
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 h-[80vh] bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 h-[80vh] bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        {/* Top bar */}
        <div className="relative z-20 px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-body text-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 min-h-[80vh] flex flex-col justify-end">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2 space-y-5 animate-fade-in">
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight text-glow-cyan">
                {title.title}
              </h1>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-3">
                {title.release_date && (
                  <Badge variant="outline">{getYear(title.release_date)}</Badge>
                )}
                {title.runtime && (
                  <Badge variant="outline">{formatDuration(title.runtime * 60)}</Badge>
                )}
                <Badge variant="outline">{contentRating}</Badge>
              </div>

              {/* Genre badges */}
              <div className="flex flex-wrap gap-2">
                {title.genres.map((genre) => (
                  <Badge key={genre.id} variant="cyan">
                    {genre.name}
                  </Badge>
                ))}
              </div>

              {/* Mood tags */}
              {title.mood_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {title.mood_tags.map((mood) => (
                    <Badge key={mood.id} variant="magenta">
                      {mood.emoji && <span className="mr-1">{mood.emoji}</span>}
                      {mood.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Star rating */}
              <div className="flex items-center gap-3">
                <StarRating value={title.vote_average} readonly size="sm" />
                <span className="text-sm text-gray-400 font-body">
                  {title.vote_average.toFixed(1)} ({title.vote_count.toLocaleString()} votes)
                </span>
              </div>

              {/* Description */}
              {title.overview && (
                <p className="text-base sm:text-lg text-gray-300 font-body leading-relaxed max-w-3xl line-clamp-3">
                  {title.overview}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button variant="primary" size="lg" onClick={handlePlay}>
                  <Play className="w-5 h-5 fill-current" />
                  Play
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleWatchlist}
                  isLoading={isTogglingWatchlist}
                >
                  {isInWatchlist ? (
                    <>
                      <Check className="w-5 h-5 text-lime" />
                      <span className="text-lime">In My List</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add to My List
                    </>
                  )}
                </Button>

                {title.hls_url?.default || title.hls_url?.vimeo ? (
                  <Button variant="primary" size="lg" onClick={handlePlay}>
                    <Play className="w-5 h-5 fill-current" />
                    Play
                  </Button>
                ) : title.trailer_url ? (
                  <Button variant="secondary" size="lg" onClick={handlePlay}>
                    <Play className="w-5 h-5 fill-current" />
                    Play Trailer
                  </Button>
                ) : null}
              </div>

              {/* Rate section */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-sm text-gray-400 font-body uppercase tracking-wider">
                  Rate This:
                </span>
                <StarRating
                  value={userRating || 0}
                  onChange={handleRate}
                  readonly={isRating}
                />
                {userRating && (
                  <span className="text-xs text-lime font-body">{userRating}/10</span>
                )}
              </div>
            </div>

            {/* Poster (visible on larger screens) */}
            <div className="hidden lg:flex justify-end">
              <div className="w-64 rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <img
                  src={posterUrl}
                  alt={title.title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src = '/placeholder-poster.svg'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 -mt-12 relative z-20 space-y-12">
        {/* Cast & Crew */}
        {cast.length > 0 && (
          <section className="glass rounded-2xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-cyan" />
              <h2 className="text-xl font-heading font-bold text-white">Cast & Crew</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {cast.map((member) => (
                <div
                  key={member.id}
                  className="flex-shrink-0 w-28 sm:w-32 text-center space-y-2"
                >
                  <Avatar
                    src={member.avatar_url}
                    name={member.name}
                    size="lg"
                    className="mx-auto"
                  />
                  <div>
                    <p className="text-sm font-medium text-white font-body truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-400 font-body truncate">
                      {member.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rating Distribution */}
        {ratingSummary && (
          <section className="animate-fade-in">
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-heading font-bold text-white mb-6">
                Rating Distribution
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Average score */}
                <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-surface-light/50 rounded-xl">
                  <div className="text-5xl font-heading font-bold text-lime text-glow-lime">
                    {ratingSummary.average.toFixed(1)}
                  </div>
                  <StarRating value={ratingSummary.average} readonly size="md" />
                  <p className="text-sm text-gray-400 font-body">
                    {ratingSummary.count.toLocaleString()} ratings
                  </p>
                </div>

                {/* Distribution bars */}
                <div className="md:col-span-2 space-y-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const score = i + 1
                    const count = ratingSummary.distribution[score] || 0
                    const pct =
                      ratingSummary.count > 0
                        ? (count / ratingSummary.count) * 100
                        : 0
                    return (
                      <div key={score} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono w-4 text-right">
                          {score}
                        </span>
                        <ProgressBar
                          value={pct}
                          variant={pct >= 50 ? 'lime' : pct >= 20 ? 'cyan' : 'magenta'}
                          height={8}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 font-mono w-10 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Abandon Point Analytics */}
        {abandonData && (
          <section className="animate-fade-in">
            <div className="glass rounded-2xl p-6 sm:p-8 border-l-2 border-magenta/50">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-magenta" />
                <h2 className="text-xl font-heading font-bold text-white">
                  Viewer Retention
                </h2>
              </div>
              <div className="space-y-4">
                <ProgressBar value={abandonData.percentage} variant="magenta" height={10} />
                <p className="text-gray-300 font-body">
                  <span className="text-magenta font-semibold">
                    {Math.round(abandonData.percentage)}%
                  </span>{' '}
                  of viewers stop watching around the{' '}
                  <span className="text-magenta font-semibold">
                    {abandonData.minute}-minute mark
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Episodes Section (TV shows) */}
        {isShow && episodes.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-white">Episodes</h2>
              {seasons.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="appearance-none bg-surface border border-border text-white font-body text-sm rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-cyan/50 cursor-pointer"
                  >
                    {seasons.map((s) => (
                      <option key={s} value={s}>
                        Season {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="flex gap-4 glass rounded-xl p-4 hover:bg-surface-light/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/watch/${title.id}?episode=${episode.id}`)}
                >
                  {/* Still image */}
                  <div className="relative flex-shrink-0 w-36 sm:w-48 aspect-video rounded-lg overflow-hidden bg-surface-light">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, 'w300')}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan font-mono text-sm font-semibold">
                        EP {episode.episode_number}
                      </span>
                      <h3 className="text-white font-heading font-semibold truncate">
                        {episode.title}
                      </h3>
                      {episode.runtime && (
                        <span className="text-gray-500 text-xs font-body flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {episode.runtime}m
                        </span>
                      )}
                    </div>
                    {episode.overview && (
                      <p className="text-sm text-gray-400 font-body line-clamp-2 leading-relaxed">
                        {episode.overview}
                      </p>
                    )}
                    {episode.air_date && (
                      <p className="text-xs text-gray-500 font-body">
                        {formatDate(episode.air_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comments Preview */}
        {topComments.length > 0 && (
          <section className="animate-fade-in">
            <div className="glass rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-cyan" />
                  <h2 className="text-xl font-heading font-bold text-white">Comments</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/watch/${id}`)}
                >
                  View all comments
                </Button>
              </div>
              <div className="space-y-4">
                {topComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-4 rounded-xl bg-surface-light/50"
                  >
                    <Avatar
                      src={comment.avatar_url}
                      name={comment.username}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white font-body">
                          {comment.username}
                        </span>
                        <span className="text-xs text-gray-500 font-body">
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.is_spoiler && (
                          <Badge variant="magenta">Spoiler</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 font-body leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-body">
                        <span>{comment.likes_count} likes</span>
                        {comment.replies.length > 0 && (
                          <span>{comment.replies.length} replies</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended Titles */}
        {recommended.length > 0 && (
          <section className="animate-fade-in">
            <h2 className="text-xl font-heading font-bold text-white mb-6">
              You May Also Like
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {recommended.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => navigate(`/title/${rec.id}`)}
                  className="flex-shrink-0 w-40 sm:w-44 cursor-pointer group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border/50 bg-surface group-hover:border-cyan/30 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                    <img
                      src={getImageUrl(rec.poster_path, 'w342')}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.src = '/placeholder-poster.svg'
                      }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <h3 className="text-sm font-heading font-semibold text-white truncate group-hover:text-cyan transition-colors">
                      {rec.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <StarRating value={rec.vote_average} readonly size="sm" />
                      <span className="text-xs text-gray-400">
                        {rec.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
