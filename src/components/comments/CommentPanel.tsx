import { useState, useEffect, type FormEvent } from 'react'
import type { Comment } from '@/types'
import { CommentItem } from './CommentItem'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { getComments, createComment } from '@/services/comments'
import { cn } from '@/lib/utils'
import { MessageSquare, Clock, Timer, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface CommentPanelProps {
  titleId: string
  currentTime: number
  onSeek: (time: number) => void
}

type SortMode = 'timestamp' | 'likes'

export function CommentPanel({ titleId, currentTime, onSeek }: CommentPanelProps) {
  const currentProfile = useAuthStore((s) => s.currentProfile)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [posting, setPosting] = useState(false)
  const [sort, setSort] = useState<SortMode>('timestamp')
  const [includeTimestamp, setIncludeTimestamp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComments() {
      setLoading(true)
      try {
        const response = await getComments(titleId, { page_size: 50 })
        setComments(response.items)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [titleId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || posting) return

    setError(null)
    if (!currentProfile) {
      setError('No profile selected')
      return
    }
    setPosting(true)
    try {
      const newComment = await createComment(titleId, {
        content: text.trim(),
        is_spoiler: isSpoiler,
        video_timestamp: includeTimestamp ? currentTime : null,
        profile_id: currentProfile.id,
      })
      setComments((prev) => [newComment, ...prev])
      setText('')
      setIsSpoiler(false)
      setIncludeTimestamp(false)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || (err instanceof Error ? err.message : 'Failed to post comment'))
    } finally {
      setPosting(false)
    }
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sort === 'timestamp') {
      const ta = a.video_timestamp ?? Infinity
      const tb = b.video_timestamp ?? Infinity
      if (ta !== tb) return ta - tb
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return b.likes_count - a.likes_count
  })

  // Count how many have timestamps
  const hasAnyTimestamps = comments.some((c) => c.video_timestamp != null)

  return (
    <div className="flex flex-col h-full">
      {/* Header with sort */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-gray-200">
          Comments
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSort('timestamp')}
            className={cn(
              'px-2 py-1 text-[10px] font-heading uppercase tracking-wider rounded transition-colors',
              sort === 'timestamp'
                ? 'bg-cyan/10 text-cyan border border-cyan/20'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Clock size={12} className="inline mr-1" />
            Time
          </button>
          <button
            onClick={() => setSort('likes')}
            className={cn(
              'px-2 py-1 text-[10px] font-heading uppercase tracking-wider rounded transition-colors',
              sort === 'likes'
                ? 'bg-magenta/10 text-magenta border border-magenta/20'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            Likes
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare size={36} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 font-heading">No comments yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentTime={currentTime}
                onSeek={onSeek}
                hasTimestamp={hasAnyTimestamps}
                titleId={titleId}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 pt-2">
          <p className="text-[11px] text-magenta font-heading">{error}</p>
        </div>
      )}
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Add a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || posting}
            isLoading={posting}
          >
            Post
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border bg-surface text-cyan focus:ring-cyan/30 focus:ring-offset-0"
            />
            <Timer size={12} className="text-magenta" />
            <span className="text-[10px] text-gray-400 font-body">
              Mark time: {currentTime > 0 ? `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}` : '--:--'}
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border bg-surface text-lime focus:ring-lime/30 focus:ring-offset-0"
            />
            <AlertTriangle size={12} className="text-lime" />
            <span className="text-[10px] text-gray-400 font-body">Spoiler</span>
          </label>
        </div>
      </form>
    </div>
  )
}
