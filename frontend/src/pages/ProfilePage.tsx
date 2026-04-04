
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UserRoleBadge } from '@/components/shared/UserRoleBadge'
import { ClientAvatar } from '@/components/shared/ClientAvatar'
import { formatDate } from '@/utils/formatters'

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user)

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Мой профиль</CardTitle>
          <CardDescription>Данные текущего аккаунта</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <ClientAvatar firstName={user.firstName} lastName={user.lastName} size="lg" />
          <div className="space-y-1">
            <p className="text-xl font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <UserRoleBadge role={user.role} />
              <span className="text-xs text-muted-foreground">· Зарегистрирован {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ограничения backend</CardTitle>
          <CardDescription>Эта версия интерфейса адаптирована под доступные API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Редактирование профиля и смена пароля пока не поддерживаются текущим backend.</p>
          <p>Для создания новых сотрудников используйте раздел «Пользователи» под аккаунтом администратора.</p>
        </CardContent>
      </Card>
    </div>
  )
}
