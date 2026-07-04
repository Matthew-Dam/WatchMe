import api from './api'
import type { SearchResult, PaginatedResponse } from '@/types'

export async function search(params: {
  query: string
  page?: number
  page_size?: number
  genre?: string
  country?: string
  mood?: string
  content_type?: string
  year?: number
  has_trailer?: boolean
}): Promise<PaginatedResponse<SearchResult>> {
  const { query, ...rest } = params
  const response = await api.get<PaginatedResponse<SearchResult>>('/search', {
    params: { q: query, ...rest },
  })
  return response.data
}
