import api from './api'
import type { Rating, RatingSummary } from '@/types'

export async function rateTitle(
  titleId: string,
  data: { rating: number; review?: string },
): Promise<Rating> {
  const response = await api.post<Rating>(`/titles/${titleId}/ratings`, data)
  return response.data
}

export async function getRating(titleId: string): Promise<Rating | null> {
  const response = await api.get<Rating>(`/titles/${titleId}/ratings/me`)
  return response.data
}

export async function getRatingSummary(titleId: string): Promise<RatingSummary> {
  const response = await api.get<RatingSummary>(`/titles/${titleId}/ratings/summary`)
  return response.data
}

export async function getRatingHistory(params?: {
  page?: number
  size?: number
}): Promise<{ items: Rating[]; total: number; page: number; size: number; pages: number }> {
  const response = await api.get('/ratings/history', { params })
  return response.data
}
