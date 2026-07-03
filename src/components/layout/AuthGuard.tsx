import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentProfile = useAuthStore((s) => s.currentProfile)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!currentProfile) {
    return <Navigate to="/profiles" replace />
  }

  return <>{children}</>
}
