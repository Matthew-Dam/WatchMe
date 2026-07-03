import type { ChatMessage as ChatMessageType } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: ChatMessageType
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.is_system) {
    return (
      <div className="px-3 py-1.5 text-center">
        <span className="text-xs text-gray-500 italic">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors',
    )}>
      <Avatar
        src={message.avatar_url}
        name={message.username}
        size="sm"
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-heading font-semibold text-cyan truncate">
            {message.username}
          </span>
          <span className="text-[10px] text-gray-500 shrink-0">
            {formatRelativeTime(message.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-300 break-words leading-snug">
          {message.content}
        </p>
      </div>
    </div>
  )
}
