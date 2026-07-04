import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { GuestGuard } from '@/components/layout/GuestGuard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface FormErrors {
  email?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const e: FormErrors = {}
    if (!email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Invalid email format'
    }
    if (!password) {
      e.password = 'Password is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    try {
      await login(email.trim(), password)
      toast.success('Welcome back!')
      navigate('/profiles', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid email or password'
      toast.error(message)
    }
  }

  return (
    <GuestGuard>
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.08)_0%,_transparent_70%)]" />

        <div className="animate-fade-in w-full max-w-md">
          <div className="glass rounded-2xl p-8 sm:p-10 relative">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />

            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-glow-cyan text-cyan">
                WatchMe
              </h1>
              <p className="text-gray-400 font-body text-sm mt-2">
                Sign in to continue watching
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                }}
                error={errors.email}
                leftIcon={<Mail size={18} />}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                }}
                error={errors.password}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400 font-body">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-cyan hover:text-glow-cyan transition-all duration-300 font-medium"
                >
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={async () => {
                  try {
                    const redirectUri = window.location.origin
                    const res = await fetch(`/api/auth/oauth/google/login?redirect_uri=${encodeURIComponent(redirectUri)}`)
                    if (!res.ok) throw new Error('Google OAuth not configured')
                    const data = await res.json()
                    window.location.href = data.url
                  } catch {
                    toast.error('Google sign-in is not configured yet')
                  }
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </div>

          </div>
        </div>
      </div>
    </GuestGuard>
  )
}
