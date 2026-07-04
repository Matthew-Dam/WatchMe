import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import Hls from 'hls.js'
import { usePlayerStore } from '@/stores/playerStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Controls } from './Controls'
import { cn } from '@/lib/utils'

export interface VideoPlayerHandle {
  seek: (time: number) => void
  getCurrentTime: () => number
}

interface VideoPlayerProps {
  src: string
  poster?: string
  titleId: string
  onTimeUpdate?: (time: number) => void
  onProgress?: (progress: number) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer({
  src,
  poster,
  onTimeUpdate,
  onProgress,
}, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const {
    isPlaying,
    playbackRate,
    volume,
    muted,
    pip,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setPlaybackRate,
    setVolume,
    setMuted,
    setPip,
    reset,
  } = usePlayerStore()

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      const video = videoRef.current
      if (!video) return
      video.currentTime = time
      setCurrentTime(time)
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
  }), [setCurrentTime])

  // Initialize playback (HLS or MP4)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setLoading(true)
    setError(null)

    const isMp4 = src.endsWith('.mp4') || src.includes('/video')

    if (isMp4) {
      video.src = src
      const onLoad = () => setLoading(false)
      const onErr = () => { setError('Failed to load video.'); setLoading(false) }
      video.addEventListener('loadedmetadata', onLoad)
      video.addEventListener('error', onErr)
      return () => {
        video.removeEventListener('loadedmetadata', onLoad)
        video.removeEventListener('error', onErr)
        video.src = ''
        reset()
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: 2,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        debug: false,
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          hls.destroy()
          video.src = src
          video.addEventListener('loadedmetadata', () => setLoading(false))
          video.addEventListener('error', () => {
            setError('Failed to load video. Please try again.')
            setLoading(false)
          })
        }
      })

      return () => {
        hls.destroy()
        reset()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.addEventListener('loadedmetadata', () => setLoading(false))
      video.addEventListener('error', () => {
        setError('Failed to load video.')
        setLoading(false)
      })
      return () => {
        video.removeEventListener('loadedmetadata', () => setLoading(false))
        reset()
      }
    } else {
      video.src = src
      const onLoad = () => setLoading(false)
      const onErr = () => { setError('Failed to load video.'); setLoading(false) }
      video.addEventListener('loadedmetadata', onLoad)
      video.addEventListener('error', onErr)
      return () => {
        video.removeEventListener('loadedmetadata', onLoad)
        video.removeEventListener('error', onErr)
        reset()
      }
    }
  }, [src, reset])

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const time = video.currentTime
    setCurrentTime(time)
    onTimeUpdate?.(time)
  }, [setCurrentTime, onTimeUpdate])

  // Duration handler
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }, [setDuration])

  // Progress handler
  const handleProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || video.duration <= 0) return
    const progress = (video.buffered.length > 0)
      ? video.buffered.end(video.buffered.length - 1) / video.duration
      : 0
    onProgress?.(progress)
  }, [onProgress])

  // Play/Pause
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [setIsPlaying])

  // Seek
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }, [setCurrentTime])

  // Volume
  const handleVolumeChange = useCallback((vol: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = vol
    video.muted = false
    setVolume(vol)
    setMuted(false)
  }, [setVolume, setMuted])

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [setMuted])

  // Playback rate
  const handlePlaybackRateChange = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [setPlaybackRate])

  // Fullscreen
  const handleFullscreenToggle = useCallback(async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        await container.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch {
      // Fullscreen API not available
    }
  }, [])

  useEffect(() => {
    function handleFSChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  // PiP
  const handlePipToggle = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setPip(false)
      } else {
        await video.requestPictureInPicture()
        setPip(true)
      }
    } catch {
      // PiP not available
    }
  }, [setPip])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function handlePipEnter() { setPip(true) }
    function handlePipLeave() { setPip(false) }
    video.addEventListener('enterpictureinpicture', handlePipEnter)
    video.addEventListener('leavepictureinpicture', handlePipLeave)
    return () => {
      video.removeEventListener('enterpictureinpicture', handlePipEnter)
      video.removeEventListener('leavepictureinpicture', handlePipLeave)
    }
  }, [setPip])

  // Skip
  const handleSkipBack = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, video.currentTime - 10)
    setCurrentTime(video.currentTime)
  }, [setCurrentTime])

  const handleSkipForward = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(video.duration, video.currentTime + 10)
    setCurrentTime(video.currentTime)
  }, [setCurrentTime])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSkipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkipForward()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          handleFullscreenToggle()
          break
        case 'm':
        case 'M':
          e.preventDefault()
          handleMuteToggle()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayPause, handleSkipBack, handleSkipForward, handleFullscreenToggle, handleMuteToggle])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black overflow-hidden group',
        isFullscreen ? 'fixed inset-0 z-50' : 'w-full',
      )}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain cursor-pointer"
        poster={poster}
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline
        preload="auto"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <LoadingSpinner size="lg" variant="cyan" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-3">
            <p className="text-red-400 font-heading text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan/10 text-cyan border border-cyan/30 rounded-lg hover:bg-cyan/20 transition-colors text-sm font-heading uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <Controls
        isPlaying={isPlaying}
        currentTime={usePlayerStore.getState().currentTime}
        duration={usePlayerStore.getState().duration}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        isFullscreen={isFullscreen}
        pip={pip}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onFullscreenToggle={handleFullscreenToggle}
        onPipToggle={handlePipToggle}
        onPlaybackRateChange={handlePlaybackRateChange}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
      />
    </div>
  )
})
