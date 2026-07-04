export interface User {
  id: string
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  is_child: boolean
  pin: string | null
  language: string
  created_at: string
  updated_at: string
}

export interface Title {
  id: string
  tmdb_id: number | null
  title: string
  original_title: string | null
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  logo_path: string | null
  release_date: string | null
  runtime: number | null
  status: string | null
  tagline: string | null
  vote_average: number
  vote_count: number
  popularity: number
  media_type: 'movie' | 'tv'
  genres: Genre[]
  seasons: Episode[]
  episodes: Episode[]
  category: Category | null
  countries: Country[]
  mood_tags: MoodTag[]
  rating_summary: RatingSummary | null
  user_rating: number | null
  in_watchlist: boolean
  watch_progress: number | null
  trailer_url: string | null
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  tmdb_id: number | null
  title: string
  overview: string | null
  episode_number: number
  season_number: number
  still_path: string | null
  air_date: string | null
  runtime: number | null
  vote_average: number
}

export interface Genre {
  id: string
  tmdb_id: number
  name: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Country {
  id: string
  code: string
  name: string
}

export interface MoodTag {
  id: string
  name: string
  emoji: string | null
}

export interface Comment {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  title_id: string
  parent_id: string | null
  content: string
  is_spoiler: boolean
  video_timestamp?: number | null
  likes_count: number
  is_liked: boolean
  replies: Comment[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  title_id: string
  content: string
  is_system: boolean
  created_at: string
}

export interface Rating {
  id: string
  user_id: string
  title_id: string
  rating: number
  review: string | null
  created_at: string
  updated_at: string
}

export interface RatingSummary {
  average: number
  count: number
  distribution: Record<number, number>
  user_rating: number | null
}

export interface SearchResult {
  id: string
  title: string
  original_title: string | null
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
  media_type: 'movie' | 'tv'
  genres: Genre[]
  vote_average: number
  popularity: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface WatchHistoryItem {
  id: string
  title_id: string
  profile_id: string
  title: Title
  progress: number
  duration: number
  watched_at: string
}

export interface WatchlistItem {
  id: string
  title_id: string
  profile_id: string
  title: Title
  added_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}
