import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types/shared'

// Обёртка над authStore с удобными методами проверки ролей
export const useAuth = () => {
  const store = useAuthStore()

  const isAdmin = () => store.user?.role === UserRole.ADMIN
  const isTrainer = () => store.user?.role === UserRole.TRAINER
  const isClient = () => store.user?.role === UserRole.CLIENT
  const hasRole = (roles: UserRole[]) => {
    if (!store.user) return false
    return roles.includes(store.user.role)
  }

  return {
    ...store,
    isAdmin,
    isTrainer,
    isClient,
    hasRole,
  }
}
