import { Badge } from '@/components/ui/badge'
import { SubscriptionStatus } from '@/types/shared'

interface Props {
  status: SubscriptionStatus
}

const labels: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'Активный',
  [SubscriptionStatus.EXPIRING]: 'Истекает',
  [SubscriptionStatus.EXPIRED]: 'Истёк',
  [SubscriptionStatus.NONE]: 'Нет',
}

const variants: Record<SubscriptionStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  [SubscriptionStatus.ACTIVE]: 'success',
  [SubscriptionStatus.EXPIRING]: 'warning',
  [SubscriptionStatus.EXPIRED]: 'destructive',
  [SubscriptionStatus.NONE]: 'secondary',
}

export const SubscriptionStatusBadge = ({ status }: Props) => {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}
