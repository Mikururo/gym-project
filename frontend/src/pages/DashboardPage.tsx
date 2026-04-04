import { useNavigate } from 'react-router-dom'
import {
  Users, CreditCard, AlertTriangle, Calendar, TrendingUp, DollarSign,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { SubscriptionStatusBadge } from '@/components/shared/SubscriptionStatusBadge'
import { ClientAvatar } from '@/components/shared/ClientAvatar'
import { formatDate, formatCurrency, getDaysLeft } from '@/utils/formatters'
import { SubscriptionStatus } from '@/types/shared'

const StatCard = ({
  title, value, icon: Icon, description, highlight,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  highlight?: boolean
}) => (
  <Card className={highlight ? 'border-red-200 bg-red-50' : ''}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${highlight ? 'text-red-500' : 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${highlight ? 'text-red-600' : ''}`}>{value}</div>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
)

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20" />
    </CardContent>
  </Card>
)

export const DashboardPage = () => {
  const { data: stats, isLoading, isError } = useDashboard()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Не удалось загрузить данные</h2>
        <p className="mb-4 text-sm text-muted-foreground">Проверьте соединение с сервером</p>
        <Button onClick={() => window.location.reload()}>Обновить</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Дашборд</h2>
        <p className="text-muted-foreground">Общая статистика тренажёрного зала</p>
      </div>

      {/* Карточки статистики */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: isAdmin() ? 6 : 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard title="Всего клиентов" value={stats.totalClients} icon={Users} description="Зарегистрированных клиентов" />
            <StatCard title="Активные абонементы" value={stats.activeSubscriptions} icon={CreditCard} description="Действующих абонементов" />
            <StatCard
              title="Истекают через 7 дней"
              value={stats.expiringSubscriptions}
              icon={AlertTriangle}
              description="Требуют продления"
              highlight={stats.expiringSubscriptions > 0}
            />
            <StatCard title="Посещений сегодня" value={stats.visitsToday} icon={Calendar} description="За текущий день" />
            <StatCard title="Посещений за месяц" value={stats.visitsThisMonth} icon={TrendingUp} description="За текущий месяц" />
            {isAdmin() && (
              <StatCard title="Выручка за месяц" value={formatCurrency(stats.revenueThisMonth)} icon={DollarSign} description="За текущий месяц" />
            )}
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* График посещений */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Посещения за 30 дней</CardTitle>
            <CardDescription>Динамика посещаемости</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats?.visitsByDay && stats.visitsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={stats.visitsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v).slice(0, 5)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => formatDate(String(v))}
                    formatter={(v: number) => [v, 'Посещений']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Нет данных за период
              </div>
            )}
          </CardContent>
        </Card>

        {/* Истекающие абонементы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Истекают скоро
              {stats && stats.expiringSubscriptions > 0 && (
                <Badge variant="destructive">{stats.expiringSubscriptions}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : stats?.expiringSubscriptionsList && stats.expiringSubscriptionsList.length > 0 ? (
              <div className="space-y-3">
                {stats.expiringSubscriptionsList.slice(0, 5).map((sub) => {
                  const daysLeft = getDaysLeft(sub.endDate)
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border p-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${sub.clientId}`)}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {sub.client?.lastName} {sub.client?.firstName}
                        </p>
                        <p className="text-xs text-muted-foreground">до {formatDate(sub.endDate)}</p>
                      </div>
                      <Badge variant={daysLeft <= 3 ? 'destructive' : 'warning'} className="shrink-0">
                        {daysLeft < 0 ? 'Истёк' : `${daysLeft} дн.`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Нет истекающих абонементов</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Последние клиенты */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Последние клиенты</CardTitle>
            <CardDescription>Недавно добавленные клиенты</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
            Все клиенты
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : stats?.recentClients && stats.recentClients.length > 0 ? (
            <div className="space-y-2">
              {stats.recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between rounded-lg p-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <ClientAvatar firstName={client.firstName} lastName={client.lastName} photoUrl={client.photoUrl} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{client.lastName} {client.firstName}</p>
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    </div>
                  </div>
                  <SubscriptionStatusBadge status={client.subscriptionStatus ?? SubscriptionStatus.NONE} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Нет клиентов</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
