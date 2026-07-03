import { useState, type FormEvent } from 'react'
import type { Comment } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { SpoilerShield } from './SpoilerShield'
import { cn } from '@/lib/utils'
import { Heart, MessageCircle, Clock } from 'lucide-react'
import { likeComment, createComment } from '@/services/comments'
import { formatDuration } from '@/lib/utils'
import { Input } from '@/components/ui/Input'

interface CommentItemProps {
  comment: Comment
  currentTime: number
  onSeek: (time: number) => void
  hasTimestamp: boolean
  titleId: string
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CommentItem({ comment, currentTime, onSeek, hasTimestamp, titleId }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.is_liked)
  const [likeCount, setLikeCount] = useState(comment.likes_count)
  const [liking, setLiking] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  const hasTimestampValue = hasTimestamp && comment.video_timestamp != null
  const spoilerVisible = comment.is_spoiler
    ? (comment.video_timestamp != null && currentTime >= comment.video_timestamp)
    : true

  async function handleLike() {
    if (liking) return
    setLiking(true)
    try {
      const result = await likeComment(comment.id)
      setLiked(result.liked)
      setLikeCount(result.likes_count)
    } catch {
      setLiked(comment.is_liked)
      setLikeCount(comment.likes_count)
    } finally {
      setLiking(false)
    }
  }

  function handleSeek() {
    if (comment.video_timestamp != null) {
      onSeek(comment.video_timestamp)
    }
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || postingReply) return
    setPostingReply(true)
    try {
      const newReply = await createComment(titleId, {
        content: replyText.trim(),
        parent_id: comment.id,
      })
      comment.replies = [...(comment.replies || []), newReply]
      setReplyText('')
      setShowReply(false)
    } catch {
      // silently fail
    } finally {
      setPostingReply(false)
    }
  }

  return (
    <div className={cn(
      'group flex gap-3 p-3 rounded-lg transition-colors',
      'hover:bg-surface-light/30',
    )}>
      <Avatar
        src={comment.avatar_url}
        name={comment.username}
        size="sm"
        className="mt-1 shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-heading font-semibold text-gray-200">
            {comment.username}
          </span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(comment.created_at)}
          </span>
          {hasTimestampValue && (
            <button
              onClick={handleSeek}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-heading uppercase tracking-wider bg-magenta/10 text-magenta border border-magenta/20 hover:bg-magenta/20 hover:border-magenta/40 transition-colors"
              title="Jump to this timestamp"
            >
              <Clock size={10} />
              {formatDuration(comment.video_timestamp!)}
            </button>
          )}
        </div>

        {comment.is_spoiler ? (
          <SpoilerShield isVisible={spoilerVisible}>
            <p className="text-sm text-gray-300 leading-relaxed">
              {comment.content}
            </p>
          </SpoilerShield>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleLike}
            disabled={liking}
            className={cn(
              'inline-flex items-center gap-1 text-xs transition-colors',
              liked ? 'text-magenta' : 'text-gray-500 hover:text-magenta/70',
            )}
          >
            <Heart
              size={14}
              className={liked ? 'fill-magenta' : ''}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-cyan/70 transition-colors"
          >
            <MessageCircle size={14} />
            {showReply ? 'Cancel' : 'Reply'}
          </button>
        </div>

        {showReply && (
          <form onSubmit={handleReply} className="flex gap-2 mt-2">
            <Input
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="text-xs py-1.5"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || postingReply}
              className="px-3 py-1.5 text-xs font-heading uppercase tracking-wider rounded-lg bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 transition-colors disabled:opacity-50 shrink-0"
            >
              {postingReply ? '...' : 'Reply'}
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2 border-l border-border pl-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentTime={currentTime}
                onSeek={onSeek}
                hasTimestamp={hasTimestamp}
                titleId={titleId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
