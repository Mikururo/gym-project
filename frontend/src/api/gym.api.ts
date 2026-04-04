
import { gymApi } from './axios'
import type {
  IClient,
  ISubscription,
  IVisit,
  IDashboardStats,
  IPaginatedResponse,
  CreateClientDto,
  UpdateClientDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CreateVisitDto,
} from '@/types/shared'
import { SubscriptionStatus, SubscriptionType } from '@/types/shared'
import { getSubscriptionStatus } from '@/utils/formatters'

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

const normalizeSubscriptionType = (type?: string): SubscriptionType => {
  switch ((type || '').toLowerCase()) {
    case 'single':
      return SubscriptionType.SINGLE
    case 'monthly':
      return SubscriptionType.MONTHLY
    case 'quarterly':
      return SubscriptionType.QUARTERLY
    case 'annual':
      return SubscriptionType.ANNUAL
    default:
      return SubscriptionType.MONTHLY
  }
}

const normalizeSubscription = (raw: any, client?: ISubscription['client']): ISubscription => {
  const createdAt = raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()
  return {
    id: String(raw?.id ?? ''),
    clientId: String(raw?.client_id ?? raw?.clientId ?? ''),
    client,
    type: normalizeSubscriptionType(raw?.type),
    startDate: raw?.start_date ?? raw?.startDate ?? '',
    endDate: raw?.end_date ?? raw?.endDate ?? '',
    isPaid: Boolean(raw?.is_active ?? raw?.isPaid ?? true),
    price: Number(raw?.price ?? 0),
    createdAt,
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? createdAt,
  }
}

const normalizeClient = (raw: any, activeSubscription?: ISubscription | null): IClient => {
  const { firstName, lastName } = splitName(raw?.name)
  const createdAt = raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()
  const resolvedSubscription =
    activeSubscription ??
    (raw?.lastSubscription ? normalizeSubscription(raw.lastSubscription) : undefined)

  return {
    id: String(raw?.id ?? ''),
    firstName,
    lastName,
    email: raw?.email ?? '',
    phone: raw?.phone ?? '',
    birthDate: raw?.birth_date ?? raw?.birthDate,
    photoUrl: raw?.photo_url ?? raw?.photoUrl,
    notes: raw?.notes ?? undefined,
    activeSubscription: resolvedSubscription ?? undefined,
    subscriptionStatus: getSubscriptionStatus(resolvedSubscription),
    totalVisits: Number(raw?.totalVisits ?? 0),
    createdAt,
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? createdAt,
  }
}

const normalizeVisit = (raw: any, client?: IVisit['client']): IVisit => {
  const createdAt = raw?.created_at ?? raw?.createdAt ?? raw?.visited_at ?? raw?.visitDate ?? new Date().toISOString()
  return {
    id: String(raw?.id ?? ''),
    clientId: String(raw?.client_id ?? raw?.clientId ?? ''),
    client,
    visitDate: raw?.visited_at ?? raw?.visitDate ?? createdAt,
    notes: raw?.notes ?? undefined,
    createdAt,
  }
}

const getClientsMap = async (): Promise<Map<string, IClient>> => {
  const response = await gymApi.get('/clients', { params: { page: 1, limit: 1000 } })
  const data = response.data?.data ?? []
  const clients = data.map((item: any) => normalizeClient(item))
  return new Map(clients.map((client: IClient) => [client.id, client]))
}

export const getClients = async (params: {
  page?: number
  limit?: number
  search?: string
}): Promise<IPaginatedResponse<IClient>> => {
  const response = await gymApi.get('/clients', { params })
  const payload = response.data
  const items = Array.isArray(payload?.data) ? payload.data.map((item: any) => normalizeClient(item)) : []
  const page = Number(payload?.page ?? params.page ?? 1)
  const limit = Number(payload?.limit ?? params.limit ?? 10)
  const total = Number(payload?.total ?? items.length)

  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export const getClientById = async (id: string): Promise<IClient> => {
  const [detailResponse, statsResponse] = await Promise.all([
    gymApi.get(`/clients/${id}`),
    gymApi.get(`/clients/${id}/stats`).catch(() => ({ data: null })),
  ])

  const stats = statsResponse.data
  const activeSubscription = stats?.activeSubscription ? normalizeSubscription(stats.activeSubscription) : null
  const client = normalizeClient(detailResponse.data, activeSubscription)
  client.totalVisits = Number(detailResponse.data?.totalVisits ?? stats?.totalVisits ?? 0)
  if (!client.activeSubscription && detailResponse.data?.lastSubscription) {
    client.activeSubscription = normalizeSubscription(detailResponse.data.lastSubscription)
    client.subscriptionStatus = getSubscriptionStatus(client.activeSubscription)
  }
  return client
}

export const createClient = async (data: CreateClientDto): Promise<IClient> => {
  const response = await gymApi.post('/clients', {
    name: joinName(data.firstName, data.lastName),
    email: data.email || undefined,
    phone: data.phone,
    birth_date: data.birthDate || undefined,
    notes: data.notes || undefined,
    photo_url: data.photoUrl || undefined,
  })
  return normalizeClient(response.data)
}

export const updateClient = async (id: string, data: UpdateClientDto): Promise<IClient> => {
  const response = await gymApi.put(`/clients/${id}`, {
    name: joinName(data.firstName, data.lastName),
    email: data.email,
    phone: data.phone,
    birth_date: data.birthDate,
    notes: data.notes,
    photo_url: data.photoUrl,
  })
  return normalizeClient(response.data)
}

export const deleteClient = async (id: string): Promise<void> => {
  await gymApi.delete(`/clients/${id}`)
}

export const getSubscriptions = async (): Promise<ISubscription[]> => {
  const [subsResponse, clientsMap] = await Promise.all([
    gymApi.get('/subscriptions'),
    getClientsMap(),
  ])

  const items = Array.isArray(subsResponse.data) ? subsResponse.data : []
  return items.map((item: any) => {
    const client = clientsMap.get(String(item?.client_id))
    return normalizeSubscription(item, client ? {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
    } : undefined)
  })
}

export const getExpiringSubscriptions = async (): Promise<ISubscription[]> => {
  const items = await getSubscriptions()
  return items.filter((item) => getSubscriptionStatus(item) === SubscriptionStatus.EXPIRING)
}

export const createSubscription = async (data: CreateSubscriptionDto): Promise<ISubscription> => {
  const response = await gymApi.post('/subscriptions', {
    client_id: Number(data.clientId),
    type: data.type,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    is_active: data.isPaid,
  })
  return normalizeSubscription(response.data)
}

export const updateSubscription = async (
  id: string,
  data: UpdateSubscriptionDto
): Promise<ISubscription> => {
  const response = await gymApi.put(`/subscriptions/${id}`, {
    type: data.type,
    start_date: data.startDate,
    end_date: data.endDate,
    price: data.price,
    is_active: data.isPaid,
  })
  return normalizeSubscription(response.data)
}

export const deleteSubscription = async (id: string): Promise<void> => {
  await gymApi.delete(`/subscriptions/${id}`)
}

export const getVisits = async (params: {
  clientId?: string
  date?: string
  trainerId?: string
}): Promise<IVisit[]> => {
  const apiParams: Record<string, string | number> = { page: 1, limit: 1000 }
  if (params.clientId) apiParams.clientId = params.clientId
  if (params.date) {
    apiParams.from = params.date
    apiParams.to = params.date
  }

  const [visitsResponse, clientsMap] = await Promise.all([
    gymApi.get('/visits', { params: apiParams }),
    getClientsMap(),
  ])

  const items = Array.isArray(visitsResponse.data?.data) ? visitsResponse.data.data : []
  return items.map((item: any) => {
    const client = clientsMap.get(String(item?.client_id))
    return normalizeVisit(item, client ? {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
    } : undefined)
  })
}

export const createVisit = async (data: CreateVisitDto): Promise<IVisit> => {
  const response = await gymApi.post('/visits', {
    client_id: Number(data.clientId),
    visited_at: data.visitDate,
    notes: data.notes || undefined,
  })
  return normalizeVisit(response.data)
}

export const deleteVisit = async (id: string): Promise<void> => {
  await gymApi.delete(`/visits/${id}`)
}

export const getDashboardStats = async (): Promise<IDashboardStats> => {
  const today = new Date().toISOString().slice(0, 10)
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [clientsPage, recentClientsPage, subscriptions, visitsByDay] = await Promise.all([
    getClients({ page: 1, limit: 1000 }),
    getClients({ page: 1, limit: 5 }),
    getSubscriptions(),
    gymApi.get('/visits/stats/daily', { params: { from: firstDayOfMonth, to: today } }).then((r) => r.data).catch(() => []),
  ])

  const activeSubscriptions = subscriptions.filter((sub) => getSubscriptionStatus(sub) === SubscriptionStatus.ACTIVE).length
  const expiringSubscriptionsList = subscriptions
    .filter((sub) => getSubscriptionStatus(sub) === SubscriptionStatus.EXPIRING)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))

  const visitsToday = Array.isArray(visitsByDay)
    ? Number(visitsByDay.find((item: any) => item.date === today)?.count ?? 0)
    : 0
  const visitsThisMonth = Array.isArray(visitsByDay)
    ? visitsByDay.reduce((sum: number, item: any) => sum + Number(item.count ?? 0), 0)
    : 0

  const revenueThisMonth = subscriptions.reduce((sum, item) => {
    if ((item.createdAt || '').slice(0, 7) === today.slice(0, 7)) {
      return sum + Number(item.price || 0)
    }
    return sum
  }, 0)

  return {
    totalClients: clientsPage.total,
    activeSubscriptions,
    expiringSubscriptions: expiringSubscriptionsList.length,
    visitsToday,
    visitsThisMonth,
    revenueThisMonth,
    visitsByDay: Array.isArray(visitsByDay)
      ? visitsByDay.map((item: any) => ({ date: item.date, count: Number(item.count ?? 0) }))
      : [],
    recentClients: recentClientsPage.data,
    expiringSubscriptionsList: expiringSubscriptionsList.slice(0, 10),
  }
}
