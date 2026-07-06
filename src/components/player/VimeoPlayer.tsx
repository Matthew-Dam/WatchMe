import { useEffect, useRef } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface VimeoPlayerProps {
  videoId: string
  titleId: string
  poster?: string
}

export function VimeoPlayer({ videoId, poster }: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const iframe = document.createElement('iframe')
    iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`
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
    <div className="relative bg-black w-full h-full">
      {poster && (
        <div className="absolute inset-0 z-0">
          <img src={poster} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
      <div ref={containerRef} className="absolute inset-0 z-20" />
    </div>
  )
}
