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

export interface BulkImportResponse {
  imported: number
  skipped: number
  failed: number
  source?: string
  limit?: number
  collection?: string
}

export interface IACollectionItem {
  id: string
  title: string
}

export interface IACollection {
  slug: string
  name: string
  count: number
  items?: IACollectionItem[]
}

export interface MoodBackfillResponse {
  total: number
  updated: number
  skipped: number
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

export async function getTrendingTMDB(mediaType: string = 'movie'): Promise<{ items: TMDBResult[]; total: number }> {
  const response = await api.get('/admin/tmdb/trending', {
    params: { media_type: mediaType },
  })
  return response.data
}

export async function getTopRatedTMDB(mediaType: string = 'movie', page: number = 1): Promise<TMDBPopularResponse> {
  const response = await api.get('/admin/tmdb/top-rated', {
    params: { media_type: mediaType, page },
  })
  return response.data
}

export async function getNowPlayingTMDB(): Promise<{ items: TMDBResult[]; total: number }> {
  const response = await api.get('/admin/tmdb/now-playing')
  return response.data
}

export async function getAnimationTMDB(page: number = 1): Promise<TMDBPopularResponse> {
  const response = await api.get('/admin/tmdb/animation', {
    params: { page },
  })
  return response.data
}

export async function getTMDBByGenre(genre: string, mediaType: string = 'movie', page: number = 1): Promise<TMDBPopularResponse> {
  const response = await api.get('/admin/tmdb/by-genre', {
    params: { genre, media_type: mediaType, page },
  })
  return response.data
}

export async function importFromTMDB(tmdbId: number, mediaType: string = 'movie'): Promise<TMDBImportResponse> {
  const response = await api.post('/admin/tmdb/import', null, {
    params: { tmdb_id: tmdbId, media_type: mediaType },
  })
  return response.data
}

export async function bulkImportTMDB(source: string, mediaType: string = 'movie', limit: number = 20, page: number = 1): Promise<BulkImportResponse> {
  const response = await api.post('/admin/tmdb/bulk-import', null, {
    params: { source, media_type: mediaType, limit, page },
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

export async function fetchTrailer(tmdbId: number, mediaType: string = 'movie'): Promise<{ trailer_url: string | null; found: boolean }> {
  const response = await api.post('/admin/tmdb/fetch-trailer', null, {
    params: { tmdb_id: tmdbId, media_type: mediaType },
  })
  return response.data
}

export async function backfillTrailers(): Promise<{ updated: number; total: number; failed: number; skipped: number }> {
  const response = await api.post('/admin/tmdb/backfill-trailers')
  return response.data
}

export async function backfillMoods(): Promise<MoodBackfillResponse> {
  const response = await api.post('/admin/backfill-moods')
  return response.data
}

export async function searchIA(query: string, page: number = 1): Promise<{ items: any[]; total: number; page: number }> {
  const response = await api.get('/admin/ia/search', {
    params: { query, page },
  })
  return response.data
}

export async function importFromIA(identifier: string, titleName?: string): Promise<{ id: string; title: string; download_url: string }> {
  const params: any = { identifier }
  if (titleName) params.title_name = titleName
  const response = await api.post('/admin/ia/import', null, { params })
  return response.data
}

export async function getIACollections(): Promise<{ collections: IACollection[] }> {
  const response = await api.get('/admin/ia/collections')
  return response.data
}

export async function getIACollection(slug: string): Promise<IACollection> {
  const response = await api.get(`/admin/ia/collection/${slug}`)
  return response.data
}

export async function bulkImportIACollection(slug: string): Promise<BulkImportResponse> {
  const response = await api.post('/admin/ia/bulk-import-collection', null, {
    params: { slug },
  })
  return response.data
}

export async function bulkImportIATop(limit: number = 20): Promise<BulkImportResponse> {
  const response = await api.post('/admin/ia/bulk-import-top', null, {
    params: { limit },
  })
  return response.data
}

export async function clearAllTitles(): Promise<{ deleted_titles: number; deleted_imports: boolean }> {
  const response = await api.post('/admin/clear-all')
  return response.data
}

export async function runFullPipeline(): Promise<{
  imported: number; skipped: number; failed: number; trailers: number; watchable: number
}> {
  const response = await api.post('/admin/run-pipeline')
  return response.data
}
