import api from './api'
import type {
  Title,
  Genre,
  Country,
  Category,
  MoodTag,
  WatchHistoryItem,
  PaginatedResponse,
} from '@/types'

export async function getTitles(params?: {
  page?: number
  page_size?: number
  genre?: string
  country?: string
  category?: string
  mood?: string
  content_type?: string
  year?: number
  has_trailer?: boolean
  upcoming?: boolean
  sort_by?: string
  sort_order?: string
}): Promise<PaginatedResponse<Title>> {
  const response = await api.get<PaginatedResponse<Title>>('/catalog/titles', { params })
  return response.data
}

export async function getTitle(id: string): Promise<Title> {
  const response = await api.get<Title>(`/catalog/titles/${id}`)
  return response.data
}

export async function getGenres(): Promise<Genre[]> {
  const response = await api.get<Genre[]>('/catalog/genres')
  return response.data
}

export async function getCountries(): Promise<Country[]> {
  const response = await api.get<Country[]>('/catalog/countries')
  return response.data
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/catalog/categories')
  return response.data
}

export async function getMoods(): Promise<MoodTag[]> {
  const response = await api.get<MoodTag[]>('/catalog/moods')
  return response.data
}

export async function getFeatured(): Promise<Title[]> {
  const response = await api.get<Title[]>('/catalog/featured')
  return response.data
}

export async function getContinueWatching(profileId?: string): Promise<WatchHistoryItem[]> {
  const response = await api.get<WatchHistoryItem[]>('/catalog/continue-watching', {
    params: profileId ? { profile_id: profileId } : undefined,
  })
  return response.data
}
