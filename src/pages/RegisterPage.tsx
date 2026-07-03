import { useState, useMemo, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, User, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { GuestGuard } from '@/components/layout/GuestGuard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface FormErrors {
  displayName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
  { label: 'Contains a special character', test: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
]

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  if (password.length === 0) return { score: 0, label: '', color: '' }
  if (passed === 1) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (passed === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  if (passed === 3) return { score: 3, label: 'Strong', color: 'bg-lime' }
  return { score: 0, label: '', color: '' }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const strength = useMemo(() => getPasswordStrength(password), [password])

  function validate(): boolean {
    const e: FormErrors = {}
    if (!displayName.trim()) {
      e.displayName = 'Display name is required'
    } else if (displayName.trim().length < 2) {
      e.displayName = 'Display name must be at least 2 characters'
    }
    if (!email.trim()) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Invalid email format'
    }
    if (!password) {
      e.password = 'Password is required'
    } else if (password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    try {
      await register(email.trim(), displayName.trim(), password)
      await login(email.trim(), password)
      toast.success('Account created successfully! Welcome to WatchMe.')
      navigate('/profiles', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      toast.error(message)
    }
  }

  function clearError(field: keyof FormErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <GuestGuard>
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,45,149,0.08)_0%,_transparent_70%)]" />

        <div className="animate-fade-in w-full max-w-md">
          <div className="glass rounded-2xl p-8 sm:p-10 relative">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-magenta to-transparent" />

            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-glow-magenta text-magenta">
                WatchMe
              </h1>
              <p className="text-gray-400 font-body text-sm mt-2">
                Create your account to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Display Name"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  clearError('displayName')
                }}
                error={errors.displayName}
                leftIcon={<User size={18} />}
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError('email')
                }}
                error={errors.email}
                leftIcon={<Mail size={18} />}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearError('password')
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

                {password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            level <= strength.score ? strength.color : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      {strength.label && (
                        <span
                          className={`text-xs font-medium ${
                            strength.score === 3
                              ? 'text-lime'
                              : strength.score === 2
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {PASSWORD_REQUIREMENTS.map((req) => (
                        <li
                          key={req.label}
                          className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                            req.test(password) ? 'text-lime' : 'text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              req.test(password) ? 'bg-lime' : 'bg-border'
                            }`}
                          />
                          {req.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  clearError('confirmPassword')
                }}
                error={errors.confirmPassword}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400 font-body">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-magenta hover:text-glow-magenta transition-all duration-300 font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </GuestGuard>
  )
}
