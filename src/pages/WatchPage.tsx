import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayerStore } from '@/stores/playerStore'
import { useVideoProgress } from '@/hooks/useVideoProgress'
import { getTitle } from '@/services/catalog'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { CommentPanel } from '@/components/comments/CommentPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Title } from '@/types'
import { cn } from '@/lib/utils'
import { MessageSquare, MessageCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

type SidebarTab = 'comments' | 'chat'

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentTime = usePlayerStore((s) => s.currentTime)
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [title, setTitle] = useState<Title | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('comments')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load title
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getTitle(id)
      .then(setTitle)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Save progress every 10s
  useVideoProgress(id || '')

  function handleSeek(time: number) {
    playerRef.current?.seek(time)
  }

  function getStreamUrl(): string {
    return `/api/stream/${id}/master.m3u8`
  }

  function getYear(): string {
    if (!title?.release_date) return ''
    return new Date(title.release_date).getFullYear().toString()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
    )
  }

  if (!title) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <p className="text-xl font-heading text-gray-400">Title not found</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-2" />
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-surface/80 backdrop-blur-sm border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-heading">{title.title}</span>
        </button>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-1 text-xs font-heading text-cyan"
        >
          {mobileOpen ? (
            <>
              <ChevronDown size={16} />
              Hide
            </>
          ) : (
            <>
              <ChevronUp size={16} />
              {sidebarTab === 'comments' ? 'Comments' : 'Chat'}
            </>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Player Section */}
        <div className={cn(
          'flex flex-col',
          mobileOpen ? 'h-1/2 lg:h-full' : 'flex-1',
        )}>
          <div className="flex-1 flex flex-col min-h-0">
            <VideoPlayer
              ref={playerRef}
              src={getStreamUrl()}
              poster={title.backdrop_path ? `/api/image${title.backdrop_path}` : undefined}
              titleId={id || ''}
            />

            {/* Video Info Bar (desktop: below player; mobile: hidden on mobile since it's in top bar) */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-surface/60 border-t border-border">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors mr-2"
              >
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-sm font-heading font-semibold text-white truncate">
                {title.title}
              </h1>
              {getYear() && (
                <span className="text-xs text-gray-400 font-body">{getYear()}</span>
              )}
              <Badge variant="outline" className="text-[10px]">
                {title.vote_average.toFixed(1)}
              </Badge>
              <span className="text-xs text-gray-500 font-body ml-auto tabular-nums">
                {formatDuration(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={cn(
          'lg:w-[30%] lg:min-w-[320px] lg:max-w-[420px] border-l border-border flex flex-col bg-surface/30',
          'lg:h-full',
          mobileOpen ? 'flex-1' : 'hidden lg:flex',
        )}>
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setSidebarTab('comments')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-heading uppercase tracking-wider transition-colors',
                sidebarTab === 'comments'
                  ? 'text-cyan border-b-2 border-cyan bg-cyan/5'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <MessageSquare size={14} />
              Comments
            </button>
            <button
              onClick={() => setSidebarTab('chat')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-heading uppercase tracking-wider transition-colors',
                sidebarTab === 'chat'
                  ? 'text-magenta border-b-2 border-magenta bg-magenta/5'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <MessageCircle size={14} />
              Chat
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'comments' ? (
              <CommentPanel
                titleId={id || ''}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            ) : (
              <ChatPanel titleId={id || ''} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
