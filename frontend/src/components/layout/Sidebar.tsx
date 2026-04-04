
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Calendar, UserCog, Settings, Dumbbell, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/shared'
import { Button } from '@/components/ui/button'
import { UserRoleBadge } from '@/components/shared/UserRoleBadge'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Клиенты', href: '/clients', icon: Users },
  { label: 'Абонементы', href: '/subscriptions', icon: CreditCard },
  { label: 'Посещения', href: '/visits', icon: Calendar },
  { label: 'Пользователи', href: '/users', icon: UserCog, roles: [UserRole.ADMIN] },
  { label: 'Профиль', href: '/profile', icon: Settings },
]

interface Props {
  onClose?: () => void
}

export const Sidebar = ({ onClose }: Props) => {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) => !item.roles || hasRole(item.roles))

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Dumbbell className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">GymCRM</span>
      </div>

      <Separator className="bg-slate-800" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
              {user.firstName?.[0] ?? ''}{user.lastName?.[0] ?? ''}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <UserRoleBadge role={user.role} className="mt-0.5 text-xs" />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      )}
    </div>
  )
}
