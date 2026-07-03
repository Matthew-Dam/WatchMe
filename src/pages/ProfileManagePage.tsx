import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit3, Trash2, X, Check, ChevronLeft, Lock, Baby } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import * as authService from '@/services/auth'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const AVATAR_COLORS = [
  '#00F0FF', '#FF2D95', '#C6FF3D', '#FF6B35',
  '#845EC2', '#00C9A7', '#FF6B6B', '#FFE66D',
  '#4FC3F7', '#AB47BC', '#26A69A', '#EF5350',
  '#7E57C2', '#66BB6A', '#FFA726', '#42A5F5',
]

function generateAvatarUrl(name: string, color: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${encodeURIComponent(color.slice(1))}&color=fff&size=200&bold=true`
}

interface ProfileFormState {
  name: string
  avatar_color: string
  avatar_url: string
  is_child: boolean
  pin: string
  confirm_pin: string
}

const emptyForm: ProfileFormState = {
  name: '',
  avatar_color: AVATAR_COLORS[0],
  avatar_url: '',
  is_child: false,
  pin: '',
  confirm_pin: '',
}

export function ProfileManagePage() {
  const navigate = useNavigate()
  const currentProfile = useAuthStore((s) => s.currentProfile)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProfiles = useCallback(async () => {
    try {
      const data = await authService.getProfiles()
      setProfiles(data)
    } catch {
      toast.error('Failed to load profiles')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function startAdd() {
    setEditingId('__new__')
    setForm(emptyForm)
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id)
    const colorIdx = profile.avatar_url
      ? AVATAR_COLORS.findIndex((c) => profile.avatar_url?.includes(c.slice(1)))
      : -1
    setForm({
      name: profile.name,
      avatar_color: colorIdx >= 0 ? AVATAR_COLORS[colorIdx] : AVATAR_COLORS[0],
      avatar_url: profile.avatar_url || '',
      is_child: profile.is_child,
      pin: '',
      confirm_pin: '',
    })
  }

  function cancelEdit() {
    resetForm()
  }

  function handleColorSelect(color: string) {
    setForm((prev) => ({
      ...prev,
      avatar_color: color,
      avatar_url: generateAvatarUrl(prev.name || 'U', color),
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Profile name is required')
      return
    }
    if (form.name.trim().length < 1 || form.name.trim().length > 50) {
      toast.error('Profile name must be between 1 and 50 characters')
      return
    }
    if (form.pin && form.pin !== form.confirm_pin) {
      toast.error('PINs do not match')
      return
    }
    if (form.pin && (form.pin.length < 4 || form.pin.length > 6)) {
      toast.error('PIN must be 4-6 digits')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        avatar_url: form.avatar_url || generateAvatarUrl(form.name.trim(), form.avatar_color),
        is_child: form.is_child,
        pin: form.pin || undefined,
      }

      if (editingId === '__new__') {
        await authService.createProfile(payload)
        toast.success('Profile created')
      } else if (editingId) {
        await authService.updateProfile(editingId, payload)
        toast.success('Profile updated')
      }

      resetForm()
      await loadProfiles()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await authService.deleteProfile(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      await loadProfiles()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete profile'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.04)_0%,_transparent_60%)]" />

      <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate('/profiles')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-body text-sm mb-8"
        >
          <ChevronLeft size={20} />
          Back to profiles
        </button>

        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
              Manage Profiles
            </h1>
            <Button
              variant="primary"
              size="sm"
              onClick={startAdd}
            >
              <Plus size={16} />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-cyan/20"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <Avatar
                  src={profile.avatar_url}
                  name={profile.name}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-body font-medium truncate">
                    {profile.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {profile.is_child && (
                      <span className="flex items-center gap-1 text-xs text-lime">
                        <Baby size={12} />
                        Kid mode
                      </span>
                    )}
                    {profile.pin && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Lock size={12} />
                        PIN enabled
                      </span>
                    )}
                    {currentProfile?.id === profile.id && (
                      <span className="text-xs text-cyan">Active</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(profile)}
                    className="p-2 rounded-lg text-gray-400 hover:text-cyan hover:bg-cyan/10 transition-all"
                    title="Edit profile"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(profile)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete profile"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {profiles.length === 0 && !editingId && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-surface border-2 border-border flex items-center justify-center mx-auto mb-4">
                <Baby size={40} className="text-gray-500" />
              </div>
              <p className="text-gray-400 font-body mb-2">No profiles yet</p>
              <p className="text-gray-500 font-body text-sm mb-6">
                Create a profile to start watching
              </p>
              <Button variant="primary" size="lg" onClick={startAdd}>
                <Plus size={20} />
                Create Your First Profile
              </Button>
            </div>
          )}

          {editingId && (
            <div className="glass rounded-xl p-6 sm:p-8 mt-6 animate-slide-up">
              <h2 className="font-heading text-lg font-semibold text-white mb-6">
                {editingId === '__new__' ? 'New Profile' : 'Edit Profile'}
              </h2>

              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan/30">
                    <Avatar
                      src={form.avatar_url || generateAvatarUrl(form.name || 'U', form.avatar_color)}
                      name={form.name || 'U'}
                      size="xl"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-body">Avatar preview</span>
                </div>

                <div className="flex-1 space-y-5">
                  <Input
                    label="Profile Name"
                    type="text"
                    placeholder="Enter profile name"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                        avatar_url: generateAvatarUrl(e.target.value || 'U', prev.avatar_color),
                      }))
                    }}
                  />

                  <div>
                    <span className="block text-sm font-medium text-gray-300 font-body mb-2">
                      Avatar Color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded-full transition-all duration-200 ${
                            form.avatar_color === color
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, is_child: !prev.is_child, pin: prev.is_child ? '' : prev.pin }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        form.is_child ? 'bg-lime' : 'bg-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                          form.is_child ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-medium text-white font-body">
                        Kid Mode
                      </span>
                      {form.is_child && (
                        <p className="text-xs text-lime mt-0.5">
                          Kid-friendly content only
                        </p>
                      )}
                    </div>
                  </div>

                  {form.is_child && (
                    <div className="space-y-4 p-4 rounded-lg bg-surface-light/50 border border-border animate-slide-up">
                      <p className="text-xs text-gray-400 font-body">
                        Kid mode restricts content to age-appropriate titles. Optionally set a PIN to
                        prevent profile switching without permission.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="PIN (4-6 digits)"
                          type="password"
                          placeholder="Optional PIN"
                          value={form.pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setForm((prev) => ({ ...prev, pin: val }))
                          }}
                          leftIcon={<Lock size={18} />}
                        />
                        <Input
                          label="Confirm PIN"
                          type="password"
                          placeholder="Repeat PIN"
                          value={form.confirm_pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setForm((prev) => ({ ...prev, confirm_pin: val }))
                          }}
                          leftIcon={<Lock size={18} />}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSave}
                      isLoading={saving}
                    >
                      <Check size={18} />
                      {editingId === '__new__' ? 'Create' : 'Save'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={cancelEdit}
                    >
                      <X size={18} />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/browse')}
          >
            Done
          </Button>
        </div>
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Profile"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={deleteTarget.avatar_url}
                name={deleteTarget.name}
                size="lg"
              />
              <div>
                <p className="text-white font-body font-medium">
                  {deleteTarget.name}
                </p>
                <p className="text-sm text-gray-400 font-body">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400 font-body">
                All watch history, ratings, and recommendations for this profile
                will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-end pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
                isLoading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
