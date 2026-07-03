import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Profile, AuthTokens } from '@/types'
import * as authService from '@/services/auth'

interface AuthState {
  user: User | null
  profiles: Profile[]
  currentProfile: Profile | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setProfile: (profile: Profile) => void
  fetchProfiles: () => Promise<void>
  switchProfile: (profileId: string) => Promise<void>
  loadUser: () => Promise<void>
  setTokens: (tokens: AuthTokens) => void
  updateUser: (data: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profiles: [],
      currentProfile: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const tokens = await authService.login({ username, password })
          set({ tokens, isAuthenticated: true })
          await get().loadUser()
          await get().fetchProfiles()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true })
        try {
          const tokens = await authService.register({ email, username, password })
          set({ tokens, isAuthenticated: true })
          await get().loadUser()
          await get().fetchProfiles()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch {
          // ignore
        }
        set({
          user: null,
          profiles: [],
          currentProfile: null,
          tokens: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('auth-storage')
      },

      setProfile: (profile: Profile) => {
        set({ currentProfile: profile })
      },

      fetchProfiles: async () => {
        try {
          const profiles = await authService.getProfiles()
          set({ profiles })
        } catch {
          // ignore
        }
      },

      switchProfile: async (profileId: string) => {
        try {
          const profile = await authService.switchProfile(profileId)
          set({ currentProfile: profile })
        } catch {
          // ignore
        }
      },

      loadUser: async () => {
        try {
          const user = await authService.getMe()
          set({ user, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false, tokens: null })
        }
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens, isAuthenticated: true })
      },

      updateUser: async (data: Partial<User>) => {
        const user = await authService.updateMe(data)
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
