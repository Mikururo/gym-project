
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { SubscriptionType, SubscriptionStatus, ISubscription } from '@/types/shared'

export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy', { locale: ru })
}

export const formatDateTime = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy HH:mm', { locale: ru })
}

export const formatRelative = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { locale: ru, addSuffix: true })
}

export const getDaysLeft = (endDate: string) => {
  return differenceInDays(parseISO(endDate), new Date())
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const subscriptionTypeLabels: Record<SubscriptionType, string> = {
  [SubscriptionType.SINGLE]: 'Разовый',
  [SubscriptionType.MONTHLY]: 'Месячный',
  [SubscriptionType.QUARTERLY]: 'Квартальный',
  [SubscriptionType.ANNUAL]: 'Годовой',
}

export const getSubscriptionStatus = (subscription?: ISubscription | null): SubscriptionStatus => {
  if (!subscription) return SubscriptionStatus.NONE
  const daysLeft = getDaysLeft(subscription.endDate)
  if (daysLeft < 0) return SubscriptionStatus.EXPIRED
  if (daysLeft <= 7) return SubscriptionStatus.EXPIRING
  return SubscriptionStatus.ACTIVE
}

export const getSubscriptionProgress = (subscription: ISubscription): number => {
  const totalDays = differenceInDays(parseISO(subscription.endDate), parseISO(subscription.startDate))
  const daysLeft = getDaysLeft(subscription.endDate)
  if (totalDays <= 0) return 0
  const progress = ((totalDays - daysLeft) / totalDays) * 100
  return Math.min(100, Math.max(0, progress))
}

export function getFullName(
  firstOrObj: string | { firstName: string; lastName: string },
  last?: string
): string {
  if (typeof firstOrObj === 'object') {
    return `${firstOrObj.firstName} ${firstOrObj.lastName}`.trim()
  }
  return `${firstOrObj} ${last ?? ''}`.trim()
}

export const getInitials = (obj: { firstName: string; lastName: string }): string =>
  `${obj.firstName?.[0] ?? ''}${obj.lastName?.[0] ?? ''}`.toUpperCase() || '??'

export const subscriptionTypeLabel = subscriptionTypeLabels
export const formatMoney = formatCurrency

export const getAge = (birthDate: string): number => {
  const today = new Date()
  const birth = parseISO(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
