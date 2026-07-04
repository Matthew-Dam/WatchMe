import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const loadUser = useAuthStore((s) => s.loadUser)
  const fetchProfiles = useAuthStore((s) => s.fetchProfiles)
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const provider = location.pathname.includes('/auth/github/') ? 'github' : 'google'

    if (!code) {
      setError('No authorization code received')
      return
    }

    async function handleCallback() {
      try {
        const res = await fetch('/api/auth/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, provider }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || 'OAuth failed')
        }
        const data = await res.json()
        setTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: 'bearer',
        })
        await loadUser()
        await fetchProfiles()
        navigate('/profiles', { replace: true })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'OAuth login failed')
      }
    }
    handleCallback()
  }, [searchParams, location.pathname, navigate, setTokens, loadUser, fetchProfiles])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-heading">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-cyan hover:underline text-sm"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" variant="cyan" />
        <p className="text-gray-400 font-heading text-sm">Completing sign in...</p>
      </div>
    </div>
  )
}
