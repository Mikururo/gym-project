
export enum UserRole {
  ADMIN = 'admin',
  TRAINER = 'trainer',
}

export enum SubscriptionType {
  SINGLE = 'single',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING = 'EXPIRING',
  EXPIRED = 'EXPIRED',
  NONE = 'NONE',
}

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface ISubscription {
  id: string
  clientId: string
  client?: Pick<IClient, 'id' | 'firstName' | 'lastName' | 'phone'>
  type: SubscriptionType
  startDate: string
  endDate: string
  isPaid: boolean
  price: number
  createdAt: string
  updatedAt: string
}

export interface IClient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  birthDate?: string
  photoUrl?: string
  notes?: string
  subscriptionStatus: SubscriptionStatus
  activeSubscription?: ISubscription
  totalVisits?: number
  createdAt: string
  updatedAt: string
}

export interface IVisit {
  id: string
  clientId: string
  client?: Pick<IClient, 'id' | 'firstName' | 'lastName'>
  visitDate: string
  notes?: string
  createdAt: string
}

export interface ILoginRequest {
  email: string
  password: string
}

export interface IRegisterRequest {
  email: string
  password: string
  name: string
}

export interface ILoginResponse {
  accessToken: string
  refreshToken: string
  user: IUser
}

export interface IApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface IPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IDashboardStats {
  totalClients: number
  activeSubscriptions: number
  expiringSubscriptions: number
  visitsToday: number
  visitsThisMonth: number
  revenueThisMonth: number
  visitsByDay: Array<{ date: string; count: number }>
  recentClients: IClient[]
  expiringSubscriptionsList: ISubscription[]
}


export interface CreateClientDto {
  firstName: string
  lastName: string
  email?: string
  phone: string
  birthDate?: string
  notes?: string
  photoUrl?: string
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface CreateSubscriptionDto {
  clientId: string
  type: SubscriptionType
  startDate: string
  endDate: string
  isPaid: boolean
  price: number
}

export interface UpdateSubscriptionDto extends Partial<Omit<CreateSubscriptionDto, 'clientId'>> {}

export interface CreateVisitDto {
  clientId: string
  visitDate: string
  notes?: string
}
