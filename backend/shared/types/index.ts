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

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export interface Subscription {
  id: number;
  client_id: number;
  type: SubscriptionType;
  start_date: string;
  end_date: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Visit {
  id: number;
  client_id: number;
  visited_at: string;
  notes?: string;
}

export interface ClientStats {
  totalVisits: number;
  visitsThisMonth: number;
  activeSubscription: Subscription | null;
  daysUntilExpiry: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}
