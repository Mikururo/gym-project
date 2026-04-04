import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

// ─── Ключи хранилища ──────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = 'gym_access_token'
const REFRESH_TOKEN_KEY = 'gym_refresh_token'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// ─── Флаг обновления токена ───────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

// ─── Экземпляр для auth-service ───────────────────────────────────────────────
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Экземпляр для gym-service ────────────────────────────────────────────────
export const gymApi = axios.create({
  baseURL: import.meta.env.VITE_GYM_API_URL || 'http://localhost:3002',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Интерцептор запросов: добавляем Bearer token ─────────────────────────────
const addAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

authApi.interceptors.request.use(addAuthHeader)
gymApi.interceptors.request.use(addAuthHeader)

// ─── Интерцептор ответов: обновление токена при 401 ──────────────────────────
const createResponseInterceptor = (instance: typeof authApi) => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean
      }

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return instance(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = tokenStorage.getRefresh()
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post<{ accessToken: string }>(
          `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3001'}/auth/refresh`,
          { refreshToken }
        )

        const { accessToken } = response.data
        tokenStorage.setAccess(accessToken)
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return instance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )
}

createResponseInterceptor(authApi)
createResponseInterceptor(gymApi)
