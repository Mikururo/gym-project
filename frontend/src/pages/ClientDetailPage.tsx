import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Plus, CheckSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useClient, useDeleteClient } from '@/hooks/useClients'
import { useVisits, useCreateVisit } from '@/hooks/useVisits'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useAuth } from '@/hooks/useAuth'
import { useClients } from '@/hooks/useClients'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/api/auth.api'
import { UserRole, SubscriptionType } from '@/types/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClientAvatar } from '@/components/shared/ClientAvatar'
import { SubscriptionStatusBadge } from '@/components/shared/SubscriptionStatusBadge'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import {
  formatDate, formatDateTime, getAge, getDaysLeft,
  formatCurrency, subscriptionTypeLabels,
} from '@/utils/formatters'

// Получаем полное имя из объекта
const fullName = (obj: { firstName: string; lastName: string }) =>
  `${obj.firstName} ${obj.lastName}`

export const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 16))
  const [visitNotes, setVisitNotes] = useState('')

  const { data: client, isLoading } = useClient(id ?? '')
  const { data: visits } = useVisits({ clientId: id })
  const { data: subscriptions } = useSubscriptions()
  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient()
  const { mutateAsync: createVisit, isPending: isCreatingVisit } = useCreateVisit()
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const canEdit = hasRole([UserRole.ADMIN, UserRole.TRAINER])
  const trainers = usersData?.data.filter(
    u => u.role === UserRole.TRAINER || u.role === UserRole.ADMIN
  )

  const clientSubscriptions = subscriptions?.filter(s => s.clientId === id) ?? []
  const activeSub = client?.activeSubscription
  const daysLeft = activeSub ? getDaysLeft(activeSub.endDate) : null

  // Прогресс абонемента
  const progress = (() => {
    if (!activeSub) return 0
    const total = getDaysLeft(activeSub.startDate) < 0
      ? Math.abs(getDaysLeft(activeSub.startDate)) + Math.max(0, daysLeft ?? 0)
      : Math.max(1, getDaysLeft(activeSub.startDate))
    return Math.min(100, Math.max(0, (1 - (daysLeft ?? 0) / total) * 100))
  })()

  // Данные для графика посещений по неделям
  const visitChartData = (() => {
    if (!visits?.length) return []
    const weeks: Record<string, number> = {}
    visits.slice(-28).forEach(v => {
      const d = new Date(v.visitDate)
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay()))
      const key = formatDate(weekStart.toISOString())
      weeks[key] = (weeks[key] || 0) + 1
    })
    return Object.entries(weeks).map(([week, count]) => ({ week, count }))
  })()

  const handleCreateVisit = async () => {
    if (!id) return
    await createVisit({
      clientId: id,
      trainerId: selectedTrainerId || undefined,
      visitDate,
      notes: visitNotes || undefined,
    })
    setVisitDialogOpen(false)
    setVisitNotes('')
    setSelectedTrainerId('')
  }

  if (isLoading) return <PageLoader />

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Клиент не найден</p>
        <Button variant="link" onClick={() => navigate('/clients')}>← К списку клиентов</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Навигация */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link to="/clients" className="text-sm text-muted-foreground hover:underline">Клиенты</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">{fullName(client)}</span>
      </div>

      {/* Карточка клиента */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6 flex-wrap">
            <ClientAvatar
              firstName={client.firstName}
              lastName={client.lastName}
              photoUrl={client.photoUrl}
              size="lg"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{fullName(client)}</h1>
                  <p className="text-muted-foreground">{client.phone}</p>
                </div>
                <SubscriptionStatusBadge status={client.subscriptionStatus} />
              </div>
              {client.birthDate && (
                <p className="text-sm text-muted-foreground">
                  Дата рождения: {formatDate(client.birthDate)} ({getAge(client.birthDate)} лет)
                </p>
              )}
              {client.notes && (
                <p className="text-sm mt-2 p-3 bg-muted rounded-md">{client.notes}</p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />Редактировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />Удалить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Абонемент */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Абонемент</CardTitle>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => navigate('/subscriptions')}>
                <Plus className="mr-2 h-4 w-4" />Добавить
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSub ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{subscriptionTypeLabels[activeSub.type]}</Badge>
                  <span className="text-sm font-medium">{formatCurrency(activeSub.price)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDate(activeSub.startDate)}</span>
                    <span>{formatDate(activeSub.endDate)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                {daysLeft !== null && (
                  <p className={`text-sm font-medium ${daysLeft <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysLeft < 0 ? 'Абонемент истёк' : `Осталось ${daysLeft} дней`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Нет активного абонемента</p>
            )}

            {clientSubscriptions.length > 1 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  История ({clientSubscriptions.length - 1})
                </p>
                {clientSubscriptions.slice(1, 4).map(sub => (
                  <div key={sub.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>{subscriptionTypeLabels[sub.type]}</span>
                    <span>{formatDate(sub.startDate)} — {formatDate(sub.endDate)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* График посещений */}
        <Card>
          <CardHeader>
            <CardTitle>Посещения по неделям</CardTitle>
          </CardHeader>
          <CardContent>
            {visitChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={visitChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, 'Посещений']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Нет данных о посещениях
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* История посещений */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>История посещений</CardTitle>
            {visits && <p className="text-sm text-muted-foreground">Всего: {visits.length}</p>}
          </div>
          <Button size="sm" onClick={() => setVisitDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Отметить посещение
          </Button>
        </CardHeader>
        <CardContent>
          {visits && visits.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {visits.slice(0, 30).map(visit => (
                <div key={visit.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckSquare className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatDateTime(visit.visitDate)}</p>
                    {visit.trainer && (
                      <p className="text-xs text-muted-foreground">
                        Тренер: {fullName(visit.trainer)}
                      </p>
                    )}
                    {visit.notes && (
                      <p className="text-xs text-muted-foreground italic">{visit.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Посещений пока не зафиксировано
            </p>
          )}
        </CardContent>
      </Card>

      {/* Диалог добавления посещения */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отметить посещение</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Дата и время</Label>
              <Input
                type="datetime-local"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Тренер (необязательно)</Label>
              <Select onValueChange={v => setSelectedTrainerId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Без тренера" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без тренера</SelectItem>
                  {trainers?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{fullName(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Input
                placeholder="Необязательно"
                value={visitNotes}
                onChange={e => setVisitNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateVisit} disabled={isCreatingVisit}>
              {isCreatingVisit ? 'Сохранение...' : 'Отметить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Удалить клиента?"
        description={`Вы уверены, что хотите удалить ${fullName(client)}? Все данные, включая абонементы и историю посещений, будут удалены.`}
        confirmLabel="Удалить"
        onConfirm={() =>
          deleteClient(client.id, { onSuccess: () => navigate('/clients') })
        }
        isLoading={isDeleting}
      />
    </div>
  )
}
