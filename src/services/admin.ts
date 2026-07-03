import api from './api'

export interface TMDBResult {
  tmdb_id?: number
  title: string
  description: string
  year: number
  duration: number
  poster_url: string | null
  backdrop_url: string | null
  genres: string[]
  content_type: string
  is_published: boolean
}

export interface TMDBImportResponse {
  id: string
  title: string
}

export interface TMDBPopularResponse {
  items: TMDBResult[]
  total: number
  page: number
}

export async function searchTMDB(query: string, mediaType: string = 'movie'): Promise<{ items: TMDBResult[]; total: number }> {
  const response = await api.get('/admin/tmdb/search', {
    params: { query, media_type: mediaType },
  })
  return response.data
}

export async function getPopularTMDB(mediaType: string = 'movie', page: number = 1): Promise<TMDBPopularResponse> {
  const response = await api.get('/admin/tmdb/popular', {
    params: { media_type: mediaType, page },
  })
  return response.data
}

export async function importFromTMDB(tmdbId: number, mediaType: string = 'movie'): Promise<TMDBImportResponse> {
  const response = await api.post('/admin/tmdb/import', null, {
    params: { tmdb_id: tmdbId, media_type: mediaType },
  })
  return response.data
}

export interface ImportLogEntry {
  id: string
  title_name: string
  tmdb_id: number | null
  media_type: string
  status: string
  error_message: string | null
  imported_at: string
}

export async function getImportHistory(): Promise<{ items: ImportLogEntry[]; total: number }> {
  const response = await api.get('/admin/imports')
  return response.data
}
