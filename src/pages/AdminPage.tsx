import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import api from '@/services/api'
import * as catalog from '@/services/catalog'
import { searchTMDB, getPopularTMDB, importFromTMDB, type TMDBResult } from '@/services/admin'
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

function ReportsTab() {
  return (
    <div className="text-gray-400 text-sm">
      <p>Reports coming soon.</p>
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
    } catch {
      toast.error('Import failed')
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

type Tab = 'add-movie' | 'manage-titles' | 'reports' | 'tmdb-import'

const tabs: { key: Tab; label: string }[] = [
  { key: 'add-movie', label: 'Add Movie' },
  { key: 'tmdb-import', label: 'TMDB Import' },
  { key: 'manage-titles', label: 'Manage Titles' },
  { key: 'reports', label: 'Reports' },
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
            {activeTab === 'manage-titles' && <ManageTitlesTab />}
            {activeTab === 'reports' && <ReportsTab />}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
