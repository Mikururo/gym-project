
import { Bell, Menu, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useExpiringSubscriptions } from '@/hooks/useSubscriptions'

interface Props {
  onMenuClick: () => void
  pageTitle?: string
}

export const Header = ({ onMenuClick, pageTitle }: Props) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: expiringSubscriptions } = useExpiringSubscriptions()
  const expiringCount = expiringSubscriptions?.length ?? 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {pageTitle && (
        <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/subscriptions')}>
          <Bell className="h-5 w-5" />
          {expiringCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {expiringCount}
            </Badge>
          )}
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-xs text-white">
                    {user.firstName?.[0] ?? ''}{user.lastName?.[0] ?? ''}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
