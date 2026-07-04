import { useEffect, useRef, useCallback, useState } from 'react'

interface UseSSEOptions {
  autoConnect?: boolean
  onMessage?: (data: unknown) => void
}

interface UseSSEReturn {
  messages: unknown[]
  connected: boolean
  error: string | null
  connect: (url: string) => void
  disconnect: () => void
}

export function useSSE(
  url?: string,
  options: UseSSEOptions = {},
): UseSSEReturn {
  const { autoConnect = true, onMessage } = options
  const esRef = useRef<EventSource | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<unknown[]>([])
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(
    (sseUrl: string) => {
      if (esRef.current) {
        esRef.current.close()
      }

      const es = new EventSource(sseUrl)

      es.onopen = () => {
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setMessages((prev) => [...prev, data])
          onMessage?.(data)
        } catch {
          // ignore
        }
      }

      es.onerror = () => {
        setConnected(false)
        esRef.current = null
        es.close()
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect(sseUrl)
          }, Math.min(1000 * 2 ** reconnectAttempts.current, 10000))
        } else {
          setError('SSE connection failed')
        }
      }

      esRef.current = es
    },
    [onMessage],
  )

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttempts.current = maxReconnectAttempts
    if (esRef.current) {
      esRef.current.close()
    }
    setConnected(false)
    setError(null)
    setMessages([])
  }, [])

  useEffect(() => {
    if (url && autoConnect) {
      connect(url)
    }
    return () => {
      disconnect()
    }
  }, [url, autoConnect, connect, disconnect])

  return { messages, connected, error, connect, disconnect }
}
