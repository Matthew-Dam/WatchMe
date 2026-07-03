import api from './api'
import type { WatchlistItem, PaginatedResponse } from '@/types'

function getProfileId(): string | undefined {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.state?.currentProfile?.id
    }
  } catch {
    // ignore
  }
  return undefined
}

export async function getWatchlist(params?: {
  page?: number
  page_size?: number
}): Promise<PaginatedResponse<WatchlistItem>> {
  const profileId = getProfileId()
  const response = await api.get<PaginatedResponse<WatchlistItem>>('/watchlist', {
    params: { ...params, profile_id: profileId },
  })
  return response.data
}

export async function addToWatchlist(titleId: string): Promise<WatchlistItem> {
  const profileId = getProfileId()
  const response = await api.post<WatchlistItem>(`/watchlist/${titleId}`, null, {
    params: { profile_id: profileId },
  })
  return response.data
}

export async function removeFromWatchlist(titleId: string): Promise<void> {
  const profileId = getProfileId()
  await api.delete(`/watchlist/${titleId}`, {
    params: { profile_id: profileId },
  })
}

export async function checkWatchlist(titleId: string): Promise<{ in_watchlist: boolean }> {
  const profileId = getProfileId()
  const response = await api.get<{ in_watchlist: boolean }>(`/watchlist/check/${titleId}`, {
    params: { profile_id: profileId },
  })
  return response.data
}
