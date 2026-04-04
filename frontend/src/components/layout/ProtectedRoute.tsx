import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types/shared'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Props {
  requiredRoles?: UserRole[]
}

// Компонент защищённого маршрута — проверяет авторизацию и роль пользователя
export const ProtectedRoute = ({ requiredRoles }: Props) => {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Загрузка..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
