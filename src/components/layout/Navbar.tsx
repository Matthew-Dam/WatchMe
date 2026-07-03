import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Home,
  Compass,
  List,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
  Crown,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/Avatar'

export function Navbar() {
  const { isAuthenticated, user, currentProfile, profiles, logout } =
    useAuthStore()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const isAdmin = user?.email?.endsWith('@watchme.com')
  const navLinks = [
    { href: '/browse', label: 'Home', icon: Home },
    { href: '/search', label: 'Browse', icon: Compass },
    { href: '/my-list', label: 'My List', icon: List },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/browse" className="shrink-0">
            <h1 className="text-xl font-heading font-bold text-cyan text-glow-cyan tracking-wider">
              WatchMe
            </h1>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 ml-10">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-body text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative">
              <div
                className={cn(
                  'flex items-center transition-all duration-300 overflow-hidden rounded-lg border border-border/50',
                  searchOpen ? 'w-64 bg-surface/80' : 'w-9 bg-transparent',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(!searchOpen)
                    if (!searchOpen) {
                      setTimeout(() => searchRef.current?.focus(), 100)
                    }
                  }}
                  className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-cyan transition-colors shrink-0"
                >
                  <Search size={18} />
                </button>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles..."
                  className={cn(
                    'bg-transparent text-sm text-white placeholder-gray-500 outline-none pr-3 font-body',
                    searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0',
                  )}
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false)
                  }}
                />
              </div>
            </form>

            {isAuthenticated && (
              <div ref={profileRef} className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Avatar
                    src={currentProfile?.avatar_url}
                    name={currentProfile?.name || user?.username || 'User'}
                    size="sm"
                  />
                  <span className="text-sm text-gray-300 font-body max-w-[100px] truncate">
                    {currentProfile?.name || user?.username}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-gray-500 transition-transform duration-200',
                      profileOpen && 'rotate-180',
                    )}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-darker rounded-xl shadow-2xl animate-fade-in overflow-hidden">
                    <div className="p-2 border-b border-border/50">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-white font-body">
                          {currentProfile?.name || user?.username}
                        </p>
                        <p className="text-xs text-gray-500 font-body">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {profiles.length > 0 && (
                      <div className="p-2 border-b border-border/50">
                        <p className="px-3 py-1 text-xs text-gray-500 font-body uppercase tracking-wider">
                          Profiles
                        </p>
                        {profiles.slice(0, 4).map((profile) => (
                          <button
                            key={profile.id}
                            onClick={() => {
                              useAuthStore.getState().setProfile(profile)
                              setProfileOpen(false)
                            }}
                            className={cn(
                              'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-colors font-body',
                              profile.id === currentProfile?.id
                                ? 'text-cyan bg-cyan/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5',
                            )}
                          >
                            <Avatar
                              src={profile.avatar_url}
                              name={profile.name}
                              size="sm"
                            />
                            {profile.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="p-2">
                      <Link
                        to="/profile/manage"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-body"
                      >
                        <Settings size={16} />
                        Manage Profiles
                      </Link>
                      <Link
                        to="/subscriptions"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-body"
                      >
                        <Crown size={16} />
                        Subscriptions
                      </Link>
                      <Link
                        to="/watch-party"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-body"
                      >
                        <Users size={16} />
                        Watch Party
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          logout()
                          navigate('/login')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-body"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 text-gray-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          ref={mobileRef}
          className="md:hidden glass-darker border-t border-border/50 animate-fade-in"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-body"
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </div>
          {isAuthenticated && (
            <div className="px-4 py-3 border-t border-border/50 space-y-1">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar
                  src={currentProfile?.avatar_url}
                  name={currentProfile?.name || user?.username || 'User'}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-white font-body">
                    {currentProfile?.name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 font-body">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Link
                to="/profile/manage"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-body"
              >
                <Settings size={16} />
                Manage Profiles
              </Link>
              <Link
                to="/subscriptions"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-body"
              >
                <Crown size={16} />
                Subscriptions
              </Link>
              <Link
                to="/watch-party"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-body"
              >
                <Users size={16} />
                Watch Party
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  logout()
                  navigate('/login')
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors font-body"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
