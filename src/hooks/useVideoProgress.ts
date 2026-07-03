import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import api from '@/services/api'

export function useVideoProgress(titleId: string) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const lastSavedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!titleId) return

    intervalRef.current = setInterval(async () => {
      const time = usePlayerStore.getState().currentTime
      const dur = usePlayerStore.getState().duration
      if (dur <= 0) return

      if (Math.abs(time - lastSavedRef.current) >= 10) {
        lastSavedRef.current = time
        try {
          await api.post(`/titles/${titleId}/progress`, {
            progress: time,
            duration: dur,
          })
        } catch {
          // silently fail
        }
      }
    }, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      const time = usePlayerStore.getState().currentTime
      const dur = usePlayerStore.getState().duration
      if (dur > 0 && time > 0) {
        api.post(`/titles/${titleId}/progress`, {
          progress: time,
          duration: dur,
        }).catch(() => {})
      }
    }
  }, [titleId])

  return { currentTime, duration }
}
