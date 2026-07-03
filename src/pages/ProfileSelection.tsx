import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ProfileSelection() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profiles = useAuthStore((s) => s.profiles)
  const setProfile = useAuthStore((s) => s.setProfile)
  const fetchProfiles = useAuthStore((s) => s.fetchProfiles)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    setIsLoading(true)
    fetchProfiles().finally(() => setIsLoading(false))
  }, [isAuthenticated, navigate, fetchProfiles])

  function handleProfileSelect(profile: typeof profiles[0]) {
    setSelectedId(profile.id)
    setTimeout(() => {
      setProfile(profile)
      navigate('/browse', { replace: true })
    }, 300)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.05)_0%,_transparent_70%)]" />

      <div className="animate-fade-in text-center max-w-4xl w-full">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          Who&apos;s watching?
        </h1>
        <p className="text-gray-400 font-body text-sm sm:text-base mb-12">
          Select a profile to start watching
        </p>

        {profiles.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 font-body">
              No profiles yet. Create your first one!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/profile/manage')}
            >
              <Plus size={20} />
              Add Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {profiles.map((profile, index) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                disabled={selectedId === profile.id}
                className="group flex flex-col items-center gap-3 transition-all duration-300"
                style={{
                  animation: `fadeIn 0.4s ease-out ${index * 0.08}s both`,
                }}
              >
                <div
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden transition-all duration-300 ${
                    selectedId === profile.id
                      ? 'scale-95 opacity-50'
                      : 'group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]'
                  }`}
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.name}
                    size="xl"
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-cyan/50 transition-colors duration-300" />
                  {profile.is_child && (
                    <div className="absolute top-1 right-1 bg-lime rounded-full p-0.5">
                      <ChildIcon className="w-3 h-3 text-background" />
                    </div>
                  )}
                </div>
                <span className="text-sm sm:text-base font-body text-gray-300 group-hover:text-white transition-colors duration-300">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/profile/manage')}
          >
            <Plus size={20} />
            Add Profile
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/profile/manage')}
          >
            <Settings size={20} />
            Manage Profiles
          </Button>
        </div>
      </div>
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  )
}

function ChildIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}
