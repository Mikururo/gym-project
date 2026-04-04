
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@/types/shared'
import { cn } from '@/lib/utils'

interface Props {
  role: UserRole
  className?: string
}

const labels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.TRAINER]: 'Тренер',
  [UserRole.CLIENT]: 'Клиент',
}

const classes: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'border-purple-200 bg-purple-100 text-purple-800',
  [UserRole.TRAINER]: 'border-blue-200 bg-blue-100 text-blue-800',
  [UserRole.CLIENT]: 'border-gray-200 bg-gray-100 text-gray-800',
}

export const UserRoleBadge = ({ role, className }: Props) => {
  return (
    <Badge variant="outline" className={cn(classes[role], className)}>
      {labels[role]}
    </Badge>
  )
}
