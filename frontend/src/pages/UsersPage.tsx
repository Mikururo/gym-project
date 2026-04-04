
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { createUser } from '@/api/auth.api'
import { UserRole } from '@/types/shared'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRoleBadge } from '@/components/shared/UserRoleBadge'
import { ClientAvatar } from '@/components/shared/ClientAvatar'
import { formatDate } from '@/utils/formatters'

const userSchema = z.object({
  email: z.string().email('Введите корректный email'),
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type UserFormData = z.infer<typeof userSchema>

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.TRAINER]: 'Тренер',
  [UserRole.CLIENT]: 'Клиент',
}

export const UsersPage = () => {
  const currentUser = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)

  const { mutateAsync: doCreate, isPending: isCreating } = useMutation({
    mutationFn: createUser,
    onSuccess: () => toast({ title: 'Пользователь создан' }),
    onError: (error: any) =>
      toast({
        title: 'Ошибка',
        description: error?.response?.data?.error || error?.message || 'Не удалось создать пользователя',
        variant: 'destructive',
      }),
  })

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: UserRole.TRAINER },
  })

  const onSubmit = async (data: UserFormData) => {
    await doCreate(data)
    reset({ role: UserRole.TRAINER, email: '', firstName: '', lastName: '', password: '' })
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      {currentUser && (
        <Card>
          <CardHeader>
            <CardTitle>Текущий администратор</CardTitle>
            <CardDescription>Аккаунт, под которым вы вошли в систему</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ClientAvatar firstName={currentUser.firstName} lastName={currentUser.lastName} size="lg" />
            <div>
              <p className="text-lg font-semibold">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-muted-foreground">{currentUser.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <UserRoleBadge role={currentUser.role} />
                <span className="text-xs text-muted-foreground">· {formatDate(currentUser.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Регистрация сотрудников</CardTitle>
            <CardDescription>
              Текущий backend умеет создавать новых администраторов и тренеров, но не возвращает список всех пользователей.
            </CardDescription>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить пользователя
          </Button>
        </CardHeader>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Имя *</Label>
                <Input placeholder="Иван" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Фамилия *</Label>
                <Input placeholder="Иванов" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="user@gym.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Роль *</Label>
              <Select defaultValue={UserRole.TRAINER} onValueChange={(v) => setValue('role', v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[UserRole.ADMIN, UserRole.TRAINER].map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Пароль *</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Создание...' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
