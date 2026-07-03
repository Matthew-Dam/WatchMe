import api from './api'
import type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  Profile,
} from '@/types'

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/login', {
    email: data.username,
    password: data.password,
  })
  return response.data
}

export async function register(data: RegisterRequest): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/register', {
    email: data.email,
    password: data.password,
    display_name: data.username,
  })
  return response.data
}

export async function refreshToken(refresh: string): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/refresh', {
    refresh_token: refresh,
  })
  return response.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}

export async function updateMe(data: Partial<User>): Promise<User> {
  const response = await api.patch<User>('/auth/me', data)
  return response.data
}

export async function getProfiles(): Promise<Profile[]> {
  const response = await api.get<Profile[]>('/auth/profiles')
  return response.data
}

export async function createProfile(data: {
  name: string
  avatar_url?: string
  is_child?: boolean
  pin?: string
  language?: string
}): Promise<Profile> {
  const response = await api.post<Profile>('/auth/profiles', data)
  return response.data
}

export async function updateProfile(
  id: string,
  data: Partial<Profile>,
): Promise<Profile> {
  const response = await api.patch<Profile>(`/auth/profiles/${id}`, data)
  return response.data
}

export async function deleteProfile(id: string): Promise<void> {
  await api.delete(`/auth/profiles/${id}`)
}

export async function switchProfile(id: string): Promise<Profile> {
  const response = await api.post<Profile>(`/auth/profiles/${id}/switch`)
  return response.data
}
