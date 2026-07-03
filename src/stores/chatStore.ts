import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatState {
  messages: ChatMessage[]
  connected: boolean
  ws: WebSocket | null
  titleId: string | null

  sendMessage: (content: string) => void
  connect: (titleId: string, token: string) => void
  disconnect: () => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  connected: false,
  ws: null,
  titleId: null,

  sendMessage: (content: string) => {
    const { ws, titleId } = get()
    if (ws && ws.readyState === WebSocket.OPEN && titleId) {
      ws.send(JSON.stringify({ type: 'message', content, title_id: titleId }))
    }
  },

  connect: (titleId: string, token: string) => {
    const { ws } = get()
    if (ws) ws.close()

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/chat/${titleId}?token=${token}`

    const socket = new WebSocket(url)

    socket.onopen = () => {
      set({ connected: true, ws: socket, titleId })
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message' || data.type === 'system') {
          const message: ChatMessage = {
            id: data.id || crypto.randomUUID(),
            user_id: data.user_id,
            username: data.username,
            avatar_url: data.avatar_url,
            title_id: titleId,
            content: data.content,
            is_system: data.type === 'system',
            created_at: data.created_at || new Date().toISOString(),
          }
          set((state) => ({ messages: [...state.messages, message] }))
        } else if (data.type === 'history') {
          set({ messages: data.messages || [] })
        }
      } catch {
        // ignore parse errors
      }
    }

    socket.onclose = () => {
      set({ connected: false, ws: null })
    }

    socket.onerror = () => {
      socket.close()
    }
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
    }
    set({ messages: [], connected: false, ws: null, titleId: null })
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({ messages: [...state.messages, message] }))
  },

  setMessages: (messages: ChatMessage[]) => {
    set({ messages })
  },
}))
