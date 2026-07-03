import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  SkipBack,
  SkipForward,
  ChevronLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  playbackRate: number
  isFullscreen: boolean
  pip: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onMuteToggle: () => void
  onFullscreenToggle: () => void
  onPipToggle: () => void
  onPlaybackRateChange: (rate: number) => void
  onSkipBack: () => void
  onSkipForward: () => void
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function Controls({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  playbackRate,
  isFullscreen,
  pip,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPipToggle,
  onPlaybackRateChange,
  onSkipBack,
  onSkipForward,
}: ControlsProps) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(true)
  const [showRateMenu, setShowRateMenu] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseMove() {
      setVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        if (isPlaying) setVisible(false)
      }, 3000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) setVisible(true)
  }, [isPlaying])

  function handleProgressClick(e: MouseEvent<HTMLDivElement>) {
    if (!progressRef.current || duration <= 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    onSeek(pct * duration)
  }

  function handleVolumeChange(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const vol = Math.max(0, Math.min(1, x / rect.width))
    onVolumeChange(vol)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const buffered = duration > 0 ? Math.min(100, progress + 10) : 0

  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
          title="Back"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-heading">Back</span>
        </button>
      </div>

      {/* Center play/pause */}
      <div className="relative z-30 flex items-center justify-center gap-4">
        <button
          onClick={onSkipBack}
          className="p-2 text-white/70 hover:text-white transition-colors"
          title="Skip back 10s"
        >
          <SkipBack size={28} />
        </button>
        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all hover:scale-110"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-0.5" />}
        </button>
        <button
          onClick={onSkipForward}
          className="p-2 text-white/70 hover:text-white transition-colors"
          title="Skip forward 10s"
        >
          <SkipForward size={28} />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="relative z-30 px-4 pb-4 space-y-2">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress"
          onClick={handleProgressClick}
        >
          <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
          <div
            className="absolute top-0 left-0 h-full bg-cyan rounded-full group-hover/progress:shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-shadow"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-cyan rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-[0_0_8px_rgba(0,240,255,0.5)]"
            style={{ left: `${progress}%`, marginLeft: '-7px' }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className="p-1.5 text-white/80 hover:text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={onSkipBack}
              className="p-1.5 text-white/60 hover:text-white transition-colors"
              title="Skip back 10s"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={onSkipForward}
              className="p-1.5 text-white/60 hover:text-white transition-colors"
              title="Skip forward 10s"
            >
              <SkipForward size={16} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={onMuteToggle}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200">
                <div
                  className="relative h-1 w-full bg-white/20 rounded-full cursor-pointer"
                  onClick={handleVolumeChange}
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full"
                    style={{ width: `${muted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <span className="text-xs font-body text-white/70 tabular-nums min-w-[90px]">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Playback speed */}
            <div className="relative">
              <button
                onClick={() => setShowRateMenu(!showRateMenu)}
                className="px-2 py-1 text-xs font-heading text-white/70 hover:text-white border border-white/20 rounded transition-colors"
                title="Playback speed"
              >
                {playbackRate}x
              </button>
              {showRateMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 py-1 bg-surface border border-border rounded-lg shadow-xl"
                  onMouseLeave={() => setShowRateMenu(false)}
                >
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate)
                        setShowRateMenu(false)
                      }}
                      className={cn(
                        'block w-full px-4 py-1.5 text-xs font-heading text-left hover:bg-white/5 transition-colors',
                        rate === playbackRate ? 'text-cyan' : 'text-gray-400',
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            <button
              onClick={onPipToggle}
              className={cn(
                'p-1.5 transition-colors',
                pip ? 'text-cyan' : 'text-white/60 hover:text-white',
              )}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 size={16} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreenToggle}
              className="p-1.5 text-white/60 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
