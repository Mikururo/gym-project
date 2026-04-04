import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSubscriptions, useCreateSubscription, useDeleteSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/hooks/useAuth'
import { SubscriptionType, UserRole } from '@/types/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, getDaysLeft, subscriptionTypeLabel, getFullName, formatMoney } from '@/utils/formatters'

const subSchema = z.object({
  clientId: z.string().min(1, 'Выберите клиента'),
  type: z.nativeEnum(SubscriptionType),
  startDate: z.string().min(1, 'Укажите дату начала'),
  endDate: z.string().min(1, 'Укажите дату окончания'),
  price: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
  isPaid: z.boolean(),
})
type SubFormData = z.infer<typeof subSchema>

const typeColors: Record<SubscriptionType, string> = {
  [SubscriptionType.SINGLE]: 'bg-slate-100 text-slate-800',
  [SubscriptionType.MONTHLY]: 'bg-blue-100 text-blue-800',
  [SubscriptionType.QUARTERLY]: 'bg-purple-100 text-purple-800',
  [SubscriptionType.ANNUAL]: 'bg-green-100 text-green-800',
}

export const SubscriptionsPage = () => {
  const { hasRole } = useAuth()
  const { data: subscriptions, isLoading } = useSubscriptions()
  const { data: clients } = useClients({ limit: 999 })
  const { mutateAsync: createSub, isPending: isCreating } = useCreateSubscription()
  const { mutate: deleteSub, isPending: isDeleting } = useDeleteSubscription()
  const { mutate: updateSub } = useUpdateSubscription()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const canEdit = hasRole([UserRole.ADMIN, UserRole.TRAINER])
  const isAdmin = hasRole([UserRole.ADMIN])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SubFormData>({
    resolver: zodResolver(subSchema),
    defaultValues: { isPaid: false, type: SubscriptionType.MONTHLY },
  })

  const onSubmit = async (data: SubFormData) => {
    await createSub(data)
    reset()
    setAddOpen(false)
  }

  // Фильтрация по вкладкам
  const filterSubs = (tab: string) => {
    if (!subscriptions) return []
    const now = new Date()
    return subscriptions.filter(s => {
      const days = getDaysLeft(s.endDate)
      if (tab === 'active') return days > 7
      if (tab === 'expiring') return days >= 0 && days <= 7
      if (tab === 'expired') return days < 0
      return true
    })
  }

  const SubTable = ({ items }: { items: typeof subscriptions }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Клиент</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Начало</TableHead>
            <TableHead>Конец</TableHead>
            <TableHead>Осталось</TableHead>
            <TableHead>Активен</TableHead>
            {isAdmin && <TableHead>Цена</TableHead>}
            {canEdit && <TableHead className="text-right">Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5" /></TableCell>)}</TableRow>
          ))}
          {!isLoading && items?.length === 0 && (
            <TableRow><TableCell colSpan={8}><EmptyState title="Абонементов нет" /></TableCell></TableRow>
          )}
          {items?.map(s => {
            const days = getDaysLeft(s.endDate)
            return (
              <TableRow key={s.id}>
                <TableCell>
                  {s.client ? (
                    <Link to={`/clients/${s.clientId}`} className="font-medium hover:underline">
                      {getFullName(s.client)}
                    </Link>
                  ) : s.clientId}
                </TableCell>
                <TableCell>
                  <Badge className={typeColors[s.type] + ' border-0'} variant="outline">
                    {subscriptionTypeLabel[s.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(s.startDate)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(s.endDate)}</TableCell>
                <TableCell>
                  <span className={days < 7 ? 'text-red-500 font-medium' : days < 14 ? 'text-yellow-600' : 'text-green-600'}>
                    {days <= 0 ? 'Истёк' : `${days} дн.`}
                  </span>
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <input
                      type="checkbox"
                      checked={s.isPaid}
                      onChange={() => updateSub({ id: s.id, data: { isPaid: !s.isPaid } })}
                      className="h-4 w-4 cursor-pointer"
                    />
                  ) : (
                    <span>{s.isPaid ? '✓' : '✗'}</span>
                  )}
                </TableCell>
                {isAdmin && <TableCell>{formatMoney(s.price)}</TableCell>}
                {canEdit && (
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canEdit && (
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Добавить абонемент
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Все ({subscriptions?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="expiring" className="text-yellow-600">Истекают</TabsTrigger>
          <TabsTrigger value="expired" className="text-red-500">Истёкшие</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><SubTable items={filterSubs('all')} /></TabsContent>
        <TabsContent value="active"><SubTable items={filterSubs('active')} /></TabsContent>
        <TabsContent value="expiring"><SubTable items={filterSubs('expiring')} /></TabsContent>
        <TabsContent value="expired"><SubTable items={filterSubs('expired')} /></TabsContent>
      </Tabs>

      {/* Диалог добавления */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Новый абонемент</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Клиент *</Label>
              <Select onValueChange={(v) => setValue('clientId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.data.map(c => (
                    <SelectItem key={c.id} value={c.id}>{getFullName(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Тип абонемента *</Label>
              <Select defaultValue={SubscriptionType.MONTHLY} onValueChange={(v) => setValue('type', v as SubscriptionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(SubscriptionType).map(t => (
                    <SelectItem key={t} value={t}>{subscriptionTypeLabel[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Начало *</Label>
                <Input type="date" {...register('startDate')} />
              </div>
              <div className="space-y-2">
                <Label>Конец *</Label>
                <Input type="date" {...register('endDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Цена (₽) *</Label>
              <Input type="number" min={0} step={100} placeholder="3000" {...register('price')} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" {...register('isPaid')} className="h-4 w-4" />
              <Label htmlFor="isPaid">Сделать активным</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={isCreating}>{isCreating ? 'Создание...' : 'Создать'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить абонемент?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={() => deleteSub(deleteId!, { onSuccess: () => setDeleteId(null) })}
        isLoading={isDeleting}
      />
    </div>
  )
}
