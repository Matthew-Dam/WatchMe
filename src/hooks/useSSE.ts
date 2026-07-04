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
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const esRef = useRef<EventSource | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<unknown[]>([])
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const stoppedRef = useRef(false)

  const connect = useCallback(
    (sseUrl: string) => {
      if (esRef.current) {
        esRef.current.close()
      }
      stoppedRef.current = false

      const es = new EventSource(sseUrl)

      es.onopen = () => {
        if (stoppedRef.current) {
          es.close()
          return
        }
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      es.onmessage = (event) => {
        if (stoppedRef.current) return
        try {
          const data = JSON.parse(event.data)
          setMessages((prev) => [...prev, data])
          onMessageRef.current?.(data)
        } catch {
          // ignore
        }
      }

      es.onerror = () => {
        if (stoppedRef.current) return
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
    [],
  )

  const disconnect = useCallback(() => {
    stoppedRef.current = true
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttempts.current = maxReconnectAttempts
    if (esRef.current) {
      esRef.current.close()
    }
    esRef.current = null
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
    // intentionally only depend on url and autoConnect
    // connect/disconnect are stable (no deps) via useRef pattern
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoConnect])

  return { messages, connected, error, connect, disconnect }
}
