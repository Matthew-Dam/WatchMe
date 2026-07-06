import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api from '@/services/api'
import * as catalog from '@/services/catalog'
import {
  searchTMDB, getPopularTMDB, importFromTMDB, getImportHistory,
  bulkImportTMDB, bulkImportIATop, bulkImportIACollection,
  searchIA, getTMDBByGenre,
  getIACollections, backfillTrailers, backfillMoods,
  clearAllTitles, runFullPipeline, dedupTitles,
  type TMDBResult, type ImportLogEntry, type BulkImportResponse,
  type IACollection,
} from '@/services/admin'
import type { Genre, Country, Category, MoodTag } from '@/types'

interface AddMovieForm {
  title: string
  description: string
  year: number
  duration: number
  content_type: string
  genres: string[]
  countries: string[]
  categories: string[]
  mood_tags: string[]
  poster_url: string
  backdrop_url: string
  trailer_url: string
  hls_url: string
}

const emptyForm: AddMovieForm = {
  title: '',
  description: '',
  year: new Date().getFullYear(),
  duration: 0,
  content_type: 'movie',
  genres: [],
  countries: [],
  categories: [],
  mood_tags: [],
  poster_url: '',
  backdrop_url: '',
  trailer_url: '',
  hls_url: '',
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.email?.endsWith('@watchme.com')
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-400 text-lg">Access denied. Admin only.</p>
      </div>
    )
  }
  return <>{children}</>
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { id: string; name: string }[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }
  return (
    <div className="relative">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-left text-white"
      >
        {selected.length === 0
          ? `Select ${label.toLowerCase()}...`
          : `${selected.length} selected`}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border/50 rounded-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => toggle(opt.id)}
                className="accent-cyan"
              />
              {opt.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AddMovieTab() {
  const [form, setForm] = useState<AddMovieForm>(emptyForm)
  const [genres, setGenres] = useState<Genre[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [moods, setMoods] = useState<MoodTag[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      catalog.getGenres(),
      catalog.getCountries(),
      catalog.getCategories(),
      catalog.getMoods(),
    ])
      .then(([g, co, ca, m]) => {
        setGenres(g)
        setCountries(co)
        setCategories(ca)
        setMoods(m)
      })
      .catch(() => toast.error('Failed to load form options'))
  }, [])

  const set = (field: keyof AddMovieForm, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        year: form.year,
        duration: form.duration,
        content_type: form.content_type,
        genres: form.genres,
        countries: form.countries,
        categories: form.categories,
        mood_tags: form.mood_tags,
        poster_url: form.poster_url || null,
        backdrop_url: form.backdrop_url || null,
        trailer_url: form.trailer_url || null,
        hls_url: form.hls_url ? { default: form.hls_url } : {},
      }
      await api.post('/catalog/titles', payload)
      toast.success('Movie added successfully!')
      setForm(emptyForm)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add movie'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Content Type</label>
          <select
            value={form.content_type}
            onChange={(e) => set('content_type', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Year *</label>
          <input
            type="number"
            required
            value={form.year}
            onChange={(e) => set('year', Number(e.target.value))}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Duration (minutes) *</label>
          <input
            type="number"
            required
            value={form.duration}
            onChange={(e) => set('duration', Number(e.target.value))}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelect
          label="Genres"
          options={genres}
          selected={form.genres}
          onChange={(ids) => set('genres', ids)}
        />
        <MultiSelect
          label="Countries"
          options={countries}
          selected={form.countries}
          onChange={(ids) => set('countries', ids)}
        />
        <MultiSelect
          label="Categories"
          options={categories}
          selected={form.categories}
          onChange={(ids) => set('categories', ids)}
        />
        <MultiSelect
          label="Mood Tags"
          options={moods}
          selected={form.mood_tags}
          onChange={(ids) => set('mood_tags', ids)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Poster URL</label>
          <input
            type="url"
            value={form.poster_url}
            onChange={(e) => set('poster_url', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Backdrop URL</label>
          <input
            type="url"
            value={form.backdrop_url}
            onChange={(e) => set('backdrop_url', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Trailer URL</label>
          <input
            type="url"
            value={form.trailer_url}
            onChange={(e) => set('trailer_url', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">HLS URL</label>
          <input
            type="url"
            value={form.hls_url}
            onChange={(e) => set('hls_url', e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Movie'}
        </Button>
      </div>
    </form>
  )
}

function ManageTitlesTab() {
  return (
    <div className="text-gray-400 text-sm">
      <p>Title management coming soon.</p>
    </div>
  )
}

function ImportHistoryTab() {
  const [items, setItems] = useState<ImportLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getImportHistory()
      .then((res) => setItems(res.items))
      .catch(() => toast.error('Failed to load import history'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No imports yet. Use the TMDB Import tab to import titles.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-border/50">
            <th className="text-left py-2 px-2">Title</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">TMDB ID</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/20 text-gray-300">
              <td className="py-2 px-2 font-medium truncate max-w-[200px]">{item.title_name}</td>
              <td className="py-2 px-2 text-xs uppercase">{item.media_type}</td>
              <td className="py-2 px-2 text-xs text-gray-500">{item.tmdb_id ?? '—'}</td>
              <td className="py-2 px-2">
                <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {item.status}
                </span>
                {item.error_message && (
                  <span className="block text-[10px] text-red-400 mt-0.5" title={item.error_message}>
                    {item.error_message.slice(0, 60)}...
                  </span>
                )}
              </td>
              <td className="py-2 px-2 text-xs text-gray-500">
                {new Date(item.imported_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TMDBImportTab() {
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState('movie')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [mode, setMode] = useState<'search' | 'popular'>('search')

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = mode === 'popular'
        ? await getPopularTMDB(mediaType)
        : await searchTMDB(query, mediaType)
      setResults(data.items)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(result: TMDBResult) {
    setImporting(result.title)
    try {
      const data = await importFromTMDB(result.tmdb_id ?? 0, mediaType)
      toast.success(`Imported "${data.title}" successfully!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      toast.error(msg)
    } finally {
      setImporting(null)
    }
  }

  useEffect(() => {
    if (mode === 'popular') {
      handleSearch()
    }
  }, [mode, mediaType])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder={mode === 'popular' ? 'Loading popular...' : 'Search TMDB...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={mode === 'popular'}
            className="text-sm"
          />
        </div>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="bg-surface border border-border/50 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="movie">Movie</option>
          <option value="tv">TV Show</option>
        </select>
        <div className="flex gap-1">
          <Button
            variant={mode === 'search' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('search')}
          >
            Search
          </Button>
          <Button
            variant={mode === 'popular' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('popular')}
          >
            Popular
          </Button>
        </div>
        <Button variant="primary" size="sm" onClick={handleSearch} disabled={loading}>
          {loading ? 'Loading...' : mode === 'popular' ? 'Refresh' : 'Search'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" variant="cyan" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          {mode === 'popular' ? 'No popular titles found' : 'Search for titles to import from TMDB'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((result, i) => (
            <div
              key={`${result.title}-${i}`}
              className="flex gap-4 bg-surface/30 border border-border/50 rounded-lg p-4"
            >
              {result.poster_url && (
                <img
                  src={`/api/image${result.poster_url}`}
                  alt={result.title}
                  className="w-16 h-24 object-cover rounded shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-heading font-semibold text-white truncate">
                  {result.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {result.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-500">{result.year}</span>
                  <span className="text-[10px] text-gray-500">{result.duration}m</span>
                  <span className="text-[10px] text-gray-500 font-heading uppercase">
                    {result.content_type}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.genres.slice(0, 3).map((g) => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImport(result)}
                  isLoading={importing === result.title}
                  disabled={importing === result.title}
                >
                  Import
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function IAImportTab() {
  const [collections, setCollections] = useState<IACollection[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [iaQuery, setIaQuery] = useState('')
  const [iaResults, setIaResults] = useState<any[]>([])
  const [iaSearching, setIaSearching] = useState(false)

  useEffect(() => {
    getIACollections()
      .then((res) => setCollections(res.collections))
      .catch(() => toast.error('Failed to load IA collections'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSearchIA() {
    if (!iaQuery.trim()) return
    setIaSearching(true)
    try {
      const data = await searchIA(iaQuery)
      setIaResults(data.items)
    } catch {
      toast.error('IA search failed')
    } finally {
      setIaSearching(false)
    }
  }

  async function handleImportCollection(slug: string) {
    setImporting(slug)
    try {
      const res: BulkImportResponse = await bulkImportIACollection(slug)
      toast.success(`Imported ${res.imported} titles, ${res.skipped} skipped, ${res.failed} failed`)
    } catch {
      toast.error('Bulk import failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleImportTopIA() {
    setImporting('top-ia')
    try {
      const res: BulkImportResponse = await bulkImportIATop(20)
      toast.success(`Imported ${res.imported} titles, ${res.skipped} skipped, ${res.failed} failed`)
    } catch {
      toast.error('Bulk import failed')
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-heading font-semibold text-white mb-3">IA Search</h3>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search Internet Archive..."
            value={iaQuery}
            onChange={(e) => setIaQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchIA()}
            className="text-sm flex-1"
          />
          <Button variant="primary" size="sm" onClick={handleSearchIA} disabled={iaSearching}>
            {iaSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {iaResults.length > 0 && (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {iaResults.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface/20 border border-border/40 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{item.title}</p>
                  <p className="text-xs text-gray-400 truncate">{item.description?.slice(0, 100)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{item.year} &middot; {item.identifier}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-heading font-semibold text-white mb-3">Curated Collections</h3>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {collections.map((col) => (
              <div key={col.slug} className="flex items-center justify-between bg-surface/20 border border-border/40 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-white">{col.name}</p>
                  <p className="text-xs text-gray-400">{col.count} titles</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImportCollection(col.slug)}
                  isLoading={importing === col.slug}
                >
                  Import All
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-heading font-semibold text-white mb-3">Top Internet Archive Films</h3>
        <Button variant="primary" size="sm" onClick={handleImportTopIA} isLoading={importing === 'top-ia'}>
          Import Top 20 Most Downloaded
        </Button>
      </div>
    </div>
  )
}

function BulkImportTab() {
  const [importing, setImporting] = useState<string | null>(null)

  const sources = [
    { key: 'trending', label: 'Trending Now', desc: 'This week\'s hottest movies' },
    { key: 'popular', label: 'Popular', desc: 'Most popular movies on TMDB' },
    { key: 'top_rated', label: 'Top Rated', desc: 'Highest rated movies of all time' },
    { key: 'now_playing', label: 'Now Playing', desc: 'Currently in theaters' },
    { key: 'animation', label: 'Animation', desc: 'Best animated movies' },
  ]

  const genresSource = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Romance',
    'Science Fiction', 'Thriller', 'Documentary', 'Fantasy',
  ]

  async function handleBulkImport(source: string) {
    setImporting(source)
    try {
      const res: BulkImportResponse = await bulkImportTMDB(source, 'movie', 30)
      toast.success(`Imported ${res.imported} titles, ${res.skipped} skipped, ${res.failed} failed`)
    } catch {
      toast.error('Bulk import failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleGenreImport(genre: string) {
    setImporting(`genre-${genre}`)
    try {
      const preview = await getTMDBByGenre(genre)
      const ids = preview.items.slice(0, 20).map((r) => r.tmdb_id).filter(Boolean) as number[]
      let imported = 0; let failed = 0
      for (const id of ids) {
        try {
          await importFromTMDB(id)
          imported++
        } catch { failed++ }
      }
      toast.success(`Imported ${imported} ${genre} titles, ${failed} failed`)
    } catch {
      toast.error('Genre import failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleBackfillTrailers() {
    setImporting('trailers')
    try {
      const res = await backfillTrailers()
      toast.success(`Updated ${res.updated} trailers, ${res.failed} failed`)
    } catch {
      toast.error('Backfill failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleBackfillMoods() {
    setImporting('moods')
    try {
      const res = await backfillMoods()
      toast.success(`Updated ${res.updated} titles with AI moods/categories`)
    } catch {
      toast.error('Backfill failed')
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-heading font-semibold text-white mb-3">Bulk Import from TMDB</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((src) => (
            <div key={src.key} className="flex flex-col justify-between bg-surface/20 border border-border/40 rounded-lg p-4">
              <div className="mb-3">
                <p className="text-sm font-medium text-white">{src.label}</p>
                <p className="text-xs text-gray-400 mt-1">{src.desc}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkImport(src.key)}
                isLoading={importing === src.key}
              >
                Import 30 Titles
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-heading font-semibold text-white mb-3">Import by Genre</h3>
        <div className="flex flex-wrap gap-2">
          {genresSource.map((genre) => (
            <Button
              key={genre}
              variant="outline"
              size="sm"
              onClick={() => handleGenreImport(genre)}
              isLoading={importing === `genre-${genre}`}
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-border/30 pt-6">
        <h3 className="text-sm font-heading font-semibold text-white mb-3">Maintenance</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleBackfillTrailers} isLoading={importing === 'trailers'}>
            Backfill Missing Trailers
          </Button>
          <Button variant="outline" size="sm" onClick={handleBackfillMoods} isLoading={importing === 'moods'}>
            Backfill AI Moods & Categories
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} isLoading={importing === 'clear'}>
            Clear All Titles
          </Button>
          <Button variant="primary" size="sm" onClick={handleRunPipeline} isLoading={importing === 'pipeline'}>
            Run Full Pipeline (Clear + Re-import All)
          </Button>
          <Button variant="outline" size="sm" onClick={handleDedup} isLoading={importing === 'dedup'}>
            Remove Duplicates
          </Button>
        </div>
      </div>
    </div>
  )

  async function handleClearAll() {
    if (!window.confirm('DANGER: This will delete ALL titles and imports. Are you sure?')) return
    setImporting('clear')
    try {
      const res = await clearAllTitles()
      toast.success(`Deleted ${res.deleted_titles} titles`)
    } catch {
      toast.error('Clear failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleRunPipeline() {
    if (!window.confirm('Start fresh pipeline? This will clear ALL existing titles first, then re-import everything.')) return
    setImporting('pipeline')
    try {
      await clearAllTitles()
      await runFullPipeline()
      toast.success('Pipeline started in background. Check back in a few minutes.')
    } catch {
      toast.error('Pipeline failed')
    } finally {
      setImporting(null)
    }
  }

  async function handleDedup() {
    setImporting('dedup')
    try {
      const res = await dedupTitles()
      toast.success(`Removed ${res.duplicates_removed} duplicates, kept ${res.kept}`)
    } catch {
      toast.error('Dedup failed')
    } finally {
      setImporting(null)
    }
  }
}

type Tab = 'add-movie' | 'manage-titles' | 'import-history' | 'tmdb-import' | 'ia-import' | 'bulk-import'

const tabs: { key: Tab; label: string }[] = [
  { key: 'add-movie', label: 'Add Movie' },
  { key: 'tmdb-import', label: 'TMDB Import' },
  { key: 'bulk-import', label: 'Bulk Import' },
  { key: 'ia-import', label: 'Internet Archive' },
  { key: 'manage-titles', label: 'Manage Titles' },
  { key: 'import-history', label: 'Import History' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('add-movie')

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <h1 className="text-2xl font-heading font-bold text-white mb-6">
            Admin Dashboard
          </h1>
          <div className="flex gap-1 mb-8 border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-body transition-colors border-b-2 -mb-[1px] ${
                  activeTab === tab.key
                    ? 'text-cyan border-cyan'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-surface/50 border border-border/50 rounded-xl p-6">
            {activeTab === 'add-movie' && <AddMovieTab />}
            {activeTab === 'tmdb-import' && <TMDBImportTab />}
            {activeTab === 'bulk-import' && <BulkImportTab />}
            {activeTab === 'ia-import' && <IAImportTab />}
            {activeTab === 'manage-titles' && <ManageTitlesTab />}
            {activeTab === 'import-history' && <ImportHistoryTab />}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
