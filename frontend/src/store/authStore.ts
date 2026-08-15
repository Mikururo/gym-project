
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as authApiModule from '@/api/auth.api'
import { tokenStorage } from '@/api/axios'
import type { IUser } from '@/types/shared'

interface AuthState {
  user: IUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (params: { email: string; password: string; name: string }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: IUser) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authApiModule.login({ email, password })
          tokenStorage.setAccess(response.accessToken)
          tokenStorage.setRefresh(response.refreshToken)
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async ({ email, password, name }) => {
        set({ isLoading: true })
        try {
          const response = await authApiModule.register({ email, password, name })
          tokenStorage.setAccess(response.accessToken)
          tokenStorage.setRefresh(response.refreshToken)
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApiModule.logout()
        } catch {
          // ignore
        } finally {
          tokenStorage.clear()
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          })
        }
      },

      checkAuth: async () => {
        const token = tokenStorage.getAccess()
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authApiModule.getMe()
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch {
          const refreshToken = tokenStorage.getRefresh()
          if (refreshToken) {
            try {
              const { accessToken } = await authApiModule.refreshToken(refreshToken)
              tokenStorage.setAccess(accessToken)
              const user = await authApiModule.getMe()
              set({
                user,
                accessToken,
                isAuthenticated: true,
                isLoading: false,
              })
            } catch {
              tokenStorage.clear()
              set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
            }
          } else {
            tokenStorage.clear()
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
          }
        }
      },

      setUser: (user: IUser) => {
        set({ user })
      },
    }),
    {
      name: 'gym-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
)
