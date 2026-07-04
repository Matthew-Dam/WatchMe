import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSSE } from '@/hooks/useSSE'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { YouTubePlayer } from '@/components/player/YouTubePlayer'
import * as catalog from '@/services/catalog'
import { cn } from '@/lib/utils'
import { Users, Link, Play, Pause, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Title } from '@/types'

interface PartyMember {
  id: string
  name: string
  avatar_url: string | null
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  lastUpdate: number
}

export default function WatchPartyPage() {
  const { partyId } = useParams<{ partyId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentProfile, tokens } = useAuthStore()
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [members, setMembers] = useState<PartyMember[]>([])
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    lastUpdate: Date.now(),
  })
  const [titleId, setTitleId] = useState(searchParams.get('title') || '')
  const [titleData, setTitleData] = useState<Title | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  // Fetch title data when titleId changes (in a party room)
  useEffect(() => {
    if (!partyId || !titleId) return
    let cancelled = false
    catalog.getTitle(titleId).then((t) => {
      if (!cancelled) setTitleData(t)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [partyId, titleId])

  // If there's no partyId but we have title param, set it
  useEffect(() => {
    const t = searchParams.get('title')
    if (t) setTitleId(t)
  }, [searchParams])

  const resolvedPartyId = partyId || 'lobby'
  const params = new URLSearchParams()
  if (tokens?.access_token) params.set('token', tokens.access_token)
  if (currentProfile?.id) params.set('profile_id', currentProfile.id)
  const query = params.toString()
  const sseUrl = query ? `/api/events/watch-party/${resolvedPartyId}?${query}` : ''

  const { connected } = useSSE(sseUrl, {
    onMessage: (data: unknown) => {
      const msg = data as {
        type?: string
        profile_id?: string
        current_time?: number
        username?: string
        avatar_url?: string | null
        party_id?: string
      }
      if (msg.type === 'play') {
        setPlayback((p) => ({ ...p, isPlaying: true, currentTime: msg.current_time ?? p.currentTime, lastUpdate: Date.now() }))
      } else if (msg.type === 'pause') {
        setPlayback((p) => ({ ...p, isPlaying: false, currentTime: msg.current_time ?? p.currentTime, lastUpdate: Date.now() }))
      } else if (msg.type === 'seek') {
        setPlayback((p) => ({ ...p, currentTime: msg.current_time ?? p.currentTime, lastUpdate: Date.now() }))
        playerRef.current?.seek(msg.current_time ?? 0)
      } else if (msg.type === 'drift_correction') {
        setPlayback((p) => ({ ...p, currentTime: msg.current_time ?? p.currentTime, lastUpdate: Date.now() }))
        playerRef.current?.seek(msg.current_time ?? 0)
      } else if (msg.type === 'member_join') {
        setMembers((prev) => {
          if (prev.find((m) => m.id === msg.profile_id)) return prev
          return [...prev, { id: msg.profile_id!, name: msg.username || 'Anonymous', avatar_url: msg.avatar_url || null }]
        })
      } else if (msg.type === 'member_leave') {
        setMembers((prev) => prev.filter((m) => m.id !== msg.profile_id))
      }
    },
  })

  async function sendPartyEvent(eventType: string, extra: Record<string, unknown> = {}) {
    if (!tokens?.access_token || !currentProfile?.id) return
    const ep = `/api/watch-party/${resolvedPartyId}/event`
    const p = new URLSearchParams()
    p.set('token', tokens.access_token)
    p.set('event_type', eventType)
    p.set('profile_id', currentProfile.id)
    p.set('username', currentProfile.name)
    if (currentProfile.avatar_url) p.set('avatar_url', currentProfile.avatar_url)
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) p.set(k, String(v))
    }
    try {
      await fetch(ep, { method: 'POST', body: p })
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (connected && currentProfile) {
      sendPartyEvent('join')
      return () => { sendPartyEvent('leave') }
    }
  }, [connected, currentProfile])

  useEffect(() => {
    if (playback.isPlaying) {
      intervalRef.current = setInterval(() => {
        setPlayback((p) => ({
          ...p,
          currentTime: p.currentTime + 1,
          lastUpdate: Date.now(),
        }))
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playback.isPlaying])

  const handlePlay = useCallback(() => {
    const ct = playerRef.current?.getCurrentTime() ?? playback.currentTime
    sendPartyEvent('play', { current_time: ct })
    setPlayback((p) => ({ ...p, isPlaying: true }))
  }, [playback.currentTime])

  const handlePause = useCallback(() => {
    const ct = playerRef.current?.getCurrentTime() ?? playback.currentTime
    sendPartyEvent('pause', { current_time: ct })
    setPlayback((p) => ({ ...p, isPlaying: false }))
  }, [playback.currentTime])

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seek(time)
    sendPartyEvent('seek', { current_time: time })
    setPlayback((p) => ({ ...p, currentTime: time }))
  }, [])

  async function createParty() {
    if (!titleId.trim()) {
      toast.error('Enter a title ID')
      return
    }
    setCreating(true)
    const newPartyId = `party_${Date.now()}`
    navigate(`/watch-party/${newPartyId}?title=${titleId.trim()}`, { replace: !!partyId })
    setCreating(false)
  }

  function copyInviteLink() {
    const link = `${window.location.origin}/watch-party/${resolvedPartyId}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied!')
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!partyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <Users size={40} className="text-cyan mx-auto mb-3" />
            <h1 className="text-2xl font-heading font-bold text-white">Watch Party</h1>
            <p className="text-sm text-gray-400 mt-1">Create or join a watch party</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-heading uppercase tracking-wider mb-1 block">Create New Party</label>
              <Input
                placeholder="Title ID (from URL)"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
              />
              <Button className="w-full mt-2" onClick={createParty} isLoading={creating}>
                <Play size={14} className="mr-1" />
                Create Party
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-surface px-2 text-xs text-gray-500">OR</span></div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-heading uppercase tracking-wider mb-1 block">Join Existing Party</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste party code or link"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button
                  onClick={() => {
                    const code = joinCode.trim()
                    const match = code.match(/\/watch-party\/([\w-]+)/)
                    const id = match ? match[1] : code
                    if (id) navigate(`/watch-party/${id}`)
                  }}
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="text-xs text-gray-500 hover:text-gray-300 mx-auto block">
            <ArrowLeft size={12} className="inline mr-1" /> Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/browse')} className="text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <Users size={16} className="text-cyan" />
          <span className="text-sm font-heading text-white">Watch Party</span>
          <Badge variant={connected ? 'cyan' : 'outline'} className="text-[10px]">
            {connected ? `${members.length} connected` : 'disconnected'}
          </Badge>
        </div>
        <button onClick={copyInviteLink} className="text-gray-400 hover:text-cyan transition-colors">
          <Link size={16} />
        </button>
      </div>

      {titleData && (
        <div className="w-full bg-black">
          {titleData.hls_url?.youtube ? (
            <YouTubePlayer videoId={(() => {
              const m = titleData.hls_url!.youtube!.match(/(?:v=|youtu\.be\/)([\w-]+)/)
              return m ? m[1] : ''
            })()} titleId={titleData.id} />
          ) : (
            <VideoPlayer
              ref={playerRef}
              src={titleData.hls_url?.default?.endsWith('.mp4') ? `/api/stream/${titleData.id}/video` : `/api/stream/${titleData.id}/master.m3u8`}
              poster={titleData.backdrop_path ? `/api/image${titleData.backdrop_path}` : undefined}
              titleId={titleData.id}
            />
          )}
        </div>
      )}

      <div className={cn(
        'flex-1 flex flex-col items-center p-8 space-y-8',
        titleData ? 'justify-start' : 'justify-center',
      )}>
        <div className={cn(
          'glass rounded-2xl p-8 text-center space-y-6',
          titleData ? 'max-w-lg w-full' : 'max-w-lg w-full',
        )}>
          <div className="flex justify-center -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar key={m.id} src={m.avatar_url} name={m.name} size="md" className="border-2 border-background" />
            ))}
            {members.length > 5 && (
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-background flex items-center justify-center text-xs text-gray-400">
                +{members.length - 5}
              </div>
            )}
          </div>

          {connected ? (
            <>
              <div className="text-6xl font-mono font-bold text-white tabular-nums">
                {formatTime(playback.currentTime)}
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleSeek(Math.max(0, playback.currentTime - 10))}
                >
                  -10s
                </Button>
                {playback.isPlaying ? (
                  <Button variant="primary" onClick={handlePause}>
                    <Pause size={18} />
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handlePlay}>
                    <Play size={18} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleSeek(playback.currentTime + 10)}
                >
                  +10s
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size="md" variant="cyan" />
              <p className="text-sm text-gray-400">Connecting to party...</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mb-2">Members</p>
            <div className="flex flex-wrap justify-center gap-2">
              {members.map((m) => (
                <Badge key={m.id} variant="outline" className="text-xs">
                  {m.name}
                </Badge>
              ))}
              {members.length === 0 && <span className="text-xs text-gray-500">No members yet</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
