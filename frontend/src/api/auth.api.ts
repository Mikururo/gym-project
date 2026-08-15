
import { authApi } from './axios'
import type {
  IUser,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
} from '@/types/shared'
import { UserRole } from '@/types/shared'

const mapRole = (role?: string): UserRole => {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return UserRole.ADMIN
    case 'trainer':
      return UserRole.TRAINER
    default:
      return UserRole.TRAINER
  }
}

const splitName = (name?: string) => {
  const value = (name || '').trim()
  if (!value) return { firstName: '', lastName: '' }
  const parts = value.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

const normalizeUser = (raw: any): IUser => {
  const { firstName, lastName } = splitName(raw?.name)
  const createdAt = raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()

  return {
    id: String(raw?.id ?? ''),
    email: raw?.email ?? '',
    firstName,
    lastName,
    phone: raw?.phone ?? '',
    role: mapRole(raw?.role),
    createdAt,
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? createdAt,
  }
}

export const login = async (data: ILoginRequest): Promise<ILoginResponse> => {
  const response = await authApi.post('/auth/login', data)
  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: normalizeUser(response.data.user),
  }
}

export const register = async (data: IRegisterRequest): Promise<ILoginResponse> => {
  const response = await authApi.post('/auth/register', data)
  return {
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: normalizeUser(response.data.user),
  }
}

export const logout = async (): Promise<void> => {
  await authApi.post('/auth/logout')
}

export const refreshToken = async (token: string): Promise<{ accessToken: string; refreshToken?: string }> => {
  const response = await authApi.post('/auth/refresh', { refreshToken: token })
  return response.data
}

export const getMe = async (): Promise<IUser> => {
  const response = await authApi.get('/auth/me')
  return normalizeUser(response.data)
}
