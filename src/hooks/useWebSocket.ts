import { useEffect, useRef, useCallback, useState } from 'react'

interface UseWebSocketOptions {
  autoConnect?: boolean
  onMessage?: (data: unknown) => void
}

interface UseWebSocketReturn {
  sendMessage: (data: unknown) => void
  messages: unknown[]
  connected: boolean
  error: string | null
  connect: (url: string) => void
  disconnect: () => void
}

export function useWebSocket(
  url?: string,
  options: UseWebSocketOptions = {},
): UseWebSocketReturn {
  const { autoConnect = true, onMessage } = options
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<unknown[]>([])
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(
    (wsUrl: string) => {
      if (wsRef.current) {
        wsRef.current.close()
      }

      const socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setMessages((prev) => [...prev, data])
          onMessage?.(data)
        } catch {
          // ignore
        }
      }

      socket.onclose = () => {
        setConnected(false)
        wsRef.current = null
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect(wsUrl)
          }, Math.min(1000 * 2 ** reconnectAttempts.current, 10000))
        }
      }

      socket.onerror = () => {
        setError('WebSocket connection failed')
        socket.close()
      }

      wsRef.current = socket
    },
    [onMessage],
  )

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttempts.current = maxReconnectAttempts
    if (wsRef.current) {
      wsRef.current.close()
    }
    setConnected(false)
    setError(null)
    setMessages([])
  }, [])

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    if (url && autoConnect) {
      connect(url)
    }
    return () => {
      disconnect()
    }
  }, [url, autoConnect, connect, disconnect])

  return { sendMessage, messages, connected, error, connect, disconnect }
}
