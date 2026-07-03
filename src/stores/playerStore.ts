import { create } from 'zustand'

interface PlayerState {
  currentTime: number
  duration: number
  isPlaying: boolean
  playbackRate: number
  volume: number
  muted: boolean
  pip: boolean

  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setPip: (pip: boolean) => void
  reset: () => void
}

const initialState = {
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  muted: false,
  pip: false,
}

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setCurrentTime: (currentTime: number) => set({ currentTime }),
  setDuration: (duration: number) => set({ duration }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setPlaybackRate: (playbackRate: number) => set({ playbackRate }),
  setVolume: (volume: number) => set({ volume }),
  setMuted: (muted: boolean) => set({ muted }),
  setPip: (pip: boolean) => set({ pip }),
  reset: () => set(initialState),
}))
