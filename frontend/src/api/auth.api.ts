
import { authApi } from './axios'
import type {
  IUser,
  ILoginRequest,
  ILoginResponse,
  IPaginatedResponse,
  CreateUserDto,
  UpdateUserDto,
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

const joinName = (firstName?: string, lastName?: string) =>
  [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim()

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

export const getUsers = async (): Promise<IPaginatedResponse<IUser>> => {
  const me = await getMe()
  return {
    data: [me],
    total: 1,
    page: 1,
    limit: 1,
    totalPages: 1,
  }
}

export const createUser = async (data: CreateUserDto): Promise<IUser> => {
  const response = await authApi.post('/auth/register', {
    email: data.email,
    password: data.password,
    name: joinName(data.firstName, data.lastName),
    role: data.role,
  })
  return normalizeUser(response.data.user)
}

export const updateUser = async (_id: string, _data: UpdateUserDto): Promise<IUser> => {
  throw new Error('Редактирование пользователей не поддерживается текущим backend')
}

export const deleteUser = async (_id: string): Promise<void> => {
  throw new Error('Удаление пользователей не поддерживается текущим backend')
}

export const changePassword = async (_data: { currentPassword: string; newPassword: string }): Promise<void> => {
  throw new Error('Смена пароля не поддерживается текущим backend')
}
