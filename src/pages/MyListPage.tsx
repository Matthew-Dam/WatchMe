import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as watchlistService from '@/services/watchlist'

import { AuthGuard } from '@/components/layout/AuthGuard'
import { Navbar } from '@/components/layout/Navbar'
import { TitleRow } from '@/components/common/TitleRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { Title } from '@/types'

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-[80vh] min-h-[500px] shimmer-bg" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 pb-16 -mt-16 relative z-20">
        {[1, 2].map((row) => (
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
        <span className="text-4xl font-heading font-bold text-gray-600">+</span>
      </div>
      <h2 className="text-2xl font-heading font-bold text-white mb-2">
        Your list is empty
      </h2>
      <p className="text-gray-500 font-body text-sm max-w-md text-center mb-8">
        Add movies and shows to your list by clicking the + icon on any title
      </p>
      <Button variant="primary" size="lg" onClick={() => window.location.href = '/browse'}>
        Start Browsing
      </Button>
    </div>
  )
}

export default function MyListPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [titles, setTitles] = useState<Title[]>([])
  const [retryCount, setRetryCount] = useState(0)

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await watchlistService.getWatchlist({ page: 1, page_size: 50 })
      setTitles(response.items.map((item) => item.title))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load watchlist'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist, retryCount])

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  const handlePlay = useCallback(
    (title: Title) => {
      navigate(`/watch/${title.id}`)
    },
    [navigate],
  )



  const rows = titles.length > 0 ? [
    {
      key: 'my-list',
      label: 'My List',
      items: titles,
      onPlay: (title: Title) => handlePlay(title),
    },
  ] : []

  const hasContent = !loading && !error && rows.length === 0
  const hasError = !loading && error
  const showContent = !loading && !error && !hasContent

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        {loading && <LoadingSkeleton />}
        {hasError && (
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Failed to load</h2>
            <p className="text-gray-500 font-body text-sm max-w-md text-center mb-6">{error}</p>
            <Button variant="primary" onClick={handleRetry}>Try Again</Button>
          </div>
        )}

        {hasContent && <EmptyState />}

        {showContent && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-10 relative z-10">
            {rows.map((row) => (
              <TitleRow
                key={row.key}
                title={row.label}
                items={row.items}
                onPlay={row.onPlay}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}