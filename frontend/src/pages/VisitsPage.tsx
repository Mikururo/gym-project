import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useVisits, useCreateVisit, useDeleteVisit } from '@/hooks/useVisits'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/hooks/useAuth'
import { getUsers } from '@/api/auth.api'
import { useQuery } from '@tanstack/react-query'
import { UserRole } from '@/types/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime, getFullName, formatDate } from '@/utils/formatters'

const visitSchema = z.object({
  clientId: z.string().min(1, 'Выберите клиента'),
  trainerId: z.string().optional(),
  visitDate: z.string().min(1, 'Укажите дату'),
  notes: z.string().optional(),
})
type VisitFormData = z.infer<typeof visitSchema>

export const VisitsPage = () => {
  const { isAdmin, hasRole } = useAuth()
  const [filterDate, setFilterDate] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: visits, isLoading } = useVisits({ date: filterDate || undefined })
  const { data: clients } = useClients({ limit: 999 })
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const { mutateAsync: createVisit, isPending: isCreating } = useCreateVisit()
  const { mutate: deleteVisit, isPending: isDeleting } = useDeleteVisit()

  const trainers = usersData?.data.filter(u => u.role === UserRole.TRAINER || u.role === UserRole.ADMIN)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: { visitDate: new Date().toISOString().slice(0, 16) },
  })

  const onSubmit = async (data: VisitFormData) => {
    await createVisit({ ...data, trainerId: data.trainerId || undefined })
    reset()
    setAddOpen(false)
  }

  // Счётчики
  const today = formatDate(new Date())
  const todayCount = visits?.filter(v => formatDate(v.visitDate) === today).length ?? 0
  const weekCount = visits?.filter(v => {
    const days = Math.floor((Date.now() - new Date(v.visitDate).getTime()) / 86400000)
    return days <= 7
  }).length ?? 0

  return (
    <div className="space-y-4">
      {/* Счётчики */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Сегодня', value: todayCount },
          { label: 'За неделю', value: weekCount },
          { label: 'Всего', value: visits?.length ?? '...' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Фильтры и кнопка */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Дата:</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-44"
          />
          {filterDate && <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>Сбросить</Button>}
        </div>
        <Button onClick={() => setAddOpen(true)} className="ml-auto gap-2">
          <Plus className="h-4 w-4" />Отметить посещение
        </Button>
      </div>

      {/* Таблица */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата и время</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Тренер</TableHead>
              <TableHead>Заметки</TableHead>
              {isAdmin() && <TableHead className="text-right">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5" /></TableCell>)}</TableRow>
            ))}
            {!isLoading && visits?.length === 0 && (
              <TableRow><TableCell colSpan={5}><EmptyState title="Посещений нет" description="Нажмите «Отметить посещение», чтобы добавить запись" /></TableCell></TableRow>
            )}
            {visits?.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{formatDateTime(v.visitDate)}</TableCell>
                <TableCell>
                  {v.client ? (
                    <Link to={`/clients/${v.clientId}`} className="hover:underline">{getFullName(v.client)}</Link>
                  ) : v.clientId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {v.trainer ? getFullName(v.trainer) : 'Без тренера'}
                </TableCell>
                <TableCell className="text-muted-foreground italic text-sm">{v.notes || '—'}</TableCell>
                {isAdmin() && (
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Диалог добавления */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Отметить посещение</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label>Клиент *</Label>
              <Select onValueChange={(v) => setValue('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                <SelectContent>
                  {clients?.data.map(c => <SelectItem key={c.id} value={c.id}>{getFullName(c)} — {c.phone}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Тренер (необязательно)</Label>
              <Select onValueChange={(v) => setValue('trainerId', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Без тренера" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без тренера</SelectItem>
                  {trainers?.map(t => <SelectItem key={t.id} value={t.id}>{getFullName(t)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Дата и время *</Label>
              <Input type="datetime-local" {...register('visitDate')} />
            </div>

            <div className="space-y-2">
              <Label>Заметки</Label>
              <Input placeholder="Необязательно" {...register('notes')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={isCreating}>{isCreating ? 'Сохранение...' : 'Отметить'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить запись?"
        description="Запись о посещении будет удалена."
        confirmLabel="Удалить"
        onConfirm={() => deleteVisit(deleteId!, { onSuccess: () => setDeleteId(null) })}
        isLoading={isDeleting}
      />
    </div>
  )
}
