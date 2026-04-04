
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRole } from '@/types/shared'
import { useAuthStore } from '@/store/authStore'

const registerSchema = z.object({
  name: z.string().min(2, 'Введите имя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string().min(6, 'Минимум 6 символов'),
  role: z.nativeEnum(UserRole),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Пароли не совпадают',
})

type RegisterForm = z.infer<typeof registerSchema>

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.TRAINER]: 'Тренер',
  [UserRole.CLIENT]: 'Клиент',
}

export const RegisterPage = () => {
  const [serverError, setServerError] = useState<string | null>(null)
  const navigate = useNavigate()
  const authRegister = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: UserRole.TRAINER },
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role === UserRole.CLIENT ? UserRole.TRAINER : data.role,
      })
      navigate('/dashboard')
    } catch (error: any) {
      setServerError(error?.response?.data?.error || 'Не удалось зарегистрироваться')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Dumbbell className="h-9 w-9 text-white" />
          </div>
          <div className="text-center">
            <h1 className="tracking-tight text-3xl font-bold text-white">GymCRM</h1>
            <p className="mt-1 text-sm text-slate-400">Создание нового аккаунта</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Регистрация</CardTitle>
            <CardDescription className="text-slate-400">
              После регистрации вы сразу попадёте в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Имя и фамилия</Label>
                <Input
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                  placeholder="Иван Иванов"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Email</Label>
                <Input
                  type="email"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                  placeholder="trainer@gym.ru"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Роль</Label>
                <Select defaultValue={UserRole.TRAINER} onValueChange={(value) => setValue('role', value as UserRole)}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[UserRole.ADMIN, UserRole.TRAINER].map((role) => (
                      <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Пароль</Label>
                <Input
                  type="password"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Подтверждение пароля</Label>
                <Input
                  type="password"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              {serverError && (
                <div className="rounded-md border border-red-700 bg-red-900/40 px-4 py-3">
                  <p className="text-sm text-red-400">{serverError}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? 'Создание...' : 'Зарегистрироваться'}
              </Button>

              <div className="text-center text-sm text-slate-400">
                Уже есть аккаунт?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
                  Войти
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
