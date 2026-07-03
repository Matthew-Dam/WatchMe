import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/layout/AuthGuard'
import HomePage from '@/pages/HomePage'
import { SearchPage } from '@/pages/SearchPage'
import TitleDetailPage from '@/pages/TitleDetailPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProfileSelection } from '@/pages/ProfileSelection'
import { ProfileManagePage } from '@/pages/ProfileManagePage'
import WatchPage from '@/pages/WatchPage'
import MyListPage from '@/pages/MyListPage'
import AdminPage from '@/pages/AdminPage'
import { OAuthCallback } from '@/pages/OAuthCallback'
import SubscriptionPage from '@/pages/SubscriptionPage'
import WatchPartyPage from '@/pages/WatchPartyPage'
import AboutPage from '@/pages/AboutPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/browse" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/google/callback" element={<OAuthCallback />} />
      <Route path="/auth/github/callback" element={<OAuthCallback />} />
      <Route path="/profiles" element={<ProfileSelection />} />
      <Route path="/profile/manage" element={<ProfileManagePage />} />
      <Route
        path="/browse"
        element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        }
      />
      <Route
        path="/my-list"
        element={
          <AuthGuard>
            <MyListPage />
          </AuthGuard>
        }
      />
      <Route
        path="/title/:id"
        element={
          <AuthGuard>
            <TitleDetailPage />
          </AuthGuard>
        }
      />
      <Route
        path="/watch/:id"
        element={
          <AuthGuard>
            <WatchPage />
          </AuthGuard>
        }
      />
      <Route
        path="/search"
        element={
          <AuthGuard>
            <SearchPage />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <AdminPage />
          </AuthGuard>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <AuthGuard>
            <SubscriptionPage />
          </AuthGuard>
        }
      />
      <Route
        path="/watch-party"
        element={
          <AuthGuard>
            <WatchPartyPage />
          </AuthGuard>
        }
      />
      <Route
        path="/watch-party/:partyId"
        element={
          <AuthGuard>
            <WatchPartyPage />
          </AuthGuard>
        }
      />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<Navigate to="/browse" replace />} />
    </Routes>
  )
}
