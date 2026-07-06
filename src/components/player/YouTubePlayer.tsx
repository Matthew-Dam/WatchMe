import { useEffect, useRef } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface YouTubePlayerProps {
  videoId: string
  titleId: string
  poster?: string
  onTimeUpdate?: (time: number) => void
}

export function YouTubePlayer({ videoId, poster }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&vq=hd720`
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    iframe.allowFullscreen = true
    iframe.className = 'absolute inset-0 w-full h-full'
    iframe.style.border = 'none'

    container.innerHTML = ''
    container.appendChild(iframe)

    return () => {
      container.innerHTML = ''
    }
  }, [videoId])

  return (
    <div className="relative bg-black w-full aspect-video">
      {poster && (
        <div className="absolute inset-0 z-0">
          <img src={poster} alt="" className="w-full h-full object-cover opacity-50" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
      <div ref={containerRef} className="absolute inset-0 z-20" />
    </div>
  )
}
