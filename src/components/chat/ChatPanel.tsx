import { useState, useEffect, useRef, type FormEvent } from 'react'
import type { ChatMessage as ChatMessageType } from '@/types'
import { ChatMessage } from './ChatMessage'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { MessageSquare, Send } from 'lucide-react'

interface ChatPanelProps {
  titleId: string
}

const RATE_LIMIT_WINDOW = 3000
const MAX_RAPID = 5

export function ChatPanel({ titleId }: ChatPanelProps) {
  const tokens = useAuthStore((s) => s.tokens)
  const currentProfile = useAuthStore((s) => s.currentProfile)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [text, setText] = useState('')
  const [rateWarning, setRateWarning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sentTimestamps = useRef<number[]>([])

  const params = new URLSearchParams()
  if (tokens?.access_token) params.set('token', tokens.access_token)
  if (currentProfile?.id) params.set('profile_id', currentProfile.id)
  const query = params.toString()
  const WS_BASE = import.meta.env.VITE_WS_URL || ''
  const wsUrl = WS_BASE
    ? `${WS_BASE}/ws/chat/${titleId}${query ? `?${query}` : ''}`
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${titleId}${query ? `?${query}` : ''}`

  const { sendMessage, connected, error } = useWebSocket(wsUrl, {
    onMessage: (data: unknown) => {
      const msg = data as { type?: string; id?: string; user_id?: string; username?: string; avatar_url?: string | null; content?: string; is_system?: boolean; created_at?: string }
      if (msg.type === 'message' || msg.type === 'system') {
        const chatMsg: ChatMessageType = {
          id: msg.id || crypto.randomUUID(),
          user_id: msg.user_id || '',
          username: msg.username || 'System',
          avatar_url: msg.avatar_url || null,
          title_id: titleId,
          content: msg.content || '',
          is_system: msg.type === 'system',
          created_at: msg.created_at || new Date().toISOString(),
        }
        setMessages((prev) => [...prev, chatMsg])
      } else if (msg.type === 'history') {
        const history = (msg as unknown as { messages?: ChatMessageType[] }).messages
        if (history) setMessages(history)
      }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function checkRateLimit(): boolean {
    const now = Date.now()
    sentTimestamps.current = sentTimestamps.current.filter((t) => now - t < RATE_LIMIT_WINDOW)
    if (sentTimestamps.current.length >= MAX_RAPID) {
      setRateWarning(true)
      setTimeout(() => setRateWarning(false), 3000)
      return false
    }
    sentTimestamps.current.push(now)
    return true
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || !connected) return
    if (!checkRateLimit()) return

    sendMessage({ type: 'message', content: text.trim(), title_id: titleId })
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-heading font-semibold uppercase tracking-wider text-gray-200">
            Live Chat
          </h3>
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              connected ? 'bg-lime shadow-[0_0_6px_rgba(198,255,61,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
            )}
          />
        </div>
        <span className="text-[10px] text-gray-500 font-heading">
          {messages.length} msgs
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-400 font-heading">Connecting to chat...</p>
            {error && <p className="text-xs text-magenta mt-2">{error}</p>}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare size={36} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-400 font-heading">No messages yet</p>
            <p className="text-xs text-gray-500 mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        {rateWarning && (
          <p className="text-[10px] text-magenta font-heading mb-1 text-center">
            Slow down! You're sending messages too fast.
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!connected}
              className="text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || !connected}
          >
            <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  )
}
