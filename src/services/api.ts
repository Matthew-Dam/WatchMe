import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.tokens?.access_token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          const refreshToken = parsed?.state?.tokens?.refresh_token
          if (refreshToken) {
            const { data } = await axios.post('/api/auth/refresh', {
              refresh_token: refreshToken,
            })
            const newTokens = {
              access_token: data.access_token,
              refresh_token: data.refresh_token || refreshToken,
              token_type: 'bearer',
            }
            const newState = { ...parsed, state: { ...parsed.state, tokens: newTokens } }
            localStorage.setItem('auth-storage', JSON.stringify(newState))
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`
            return api(originalRequest)
          }
        }
      } catch {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
