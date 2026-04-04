import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClientAvatar } from '@/components/shared/ClientAvatar'
import { SubscriptionStatusBadge } from '@/components/shared/SubscriptionStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useClients, useDeleteClient } from '@/hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, getDaysLeft } from '@/utils/formatters'
import { UserRole, SubscriptionStatus } from '@/types/shared'

export const ClientsPage = () => {
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 15

  const debouncedSearch = useDebounce(search, 300)
  const { data, isLoading } = useClients({ page, limit: LIMIT, search: debouncedSearch })
  const deleteClient = useDeleteClient()

  const canEdit = hasRole([UserRole.ADMIN, UserRole.TRAINER])

  const handleDelete = async (id: string) => {
    try {
      await deleteClient.mutateAsync(id)
      toast({ title: 'Клиент удалён', variant: 'default' })
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить клиента', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Клиенты</h2>
          {data && (
            <p className="text-sm text-muted-foreground">Всего: {data.total} клиентов</p>
          )}
        </div>
        {canEdit && (
          <Button onClick={() => navigate('/clients/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить клиента
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Поиск по имени или телефону..."
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Абонемент</TableHead>
              <TableHead>Действует до</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={Users}
                    title="Клиентов не найдено"
                    description={search ? 'Попробуйте изменить параметры поиска' : 'Добавьте первого клиента'}
                    action={
                      canEdit && !search ? (
                        <Button onClick={() => navigate('/clients/new')} size="sm" className="gap-2">
                          <Plus className="h-4 w-4" /> Добавить
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((client) => {
                const daysLeft = client.activeSubscription
                  ? getDaysLeft(client.activeSubscription.endDate)
                  : null

                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClientAvatar
                          firstName={client.firstName}
                          lastName={client.lastName}
                          photoUrl={client.photoUrl}
                          size="sm"
                        />
                        <span className="font-medium">
                          {client.lastName} {client.firstName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={client.subscriptionStatus ?? SubscriptionStatus.NONE} />
                    </TableCell>
                    <TableCell>
                      {client.activeSubscription ? (
                        <span className={daysLeft !== null && daysLeft <= 7 ? 'font-medium text-red-600' : ''}>
                          {formatDate(client.activeSubscription.endDate)}
                          {daysLeft !== null && daysLeft >= 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">({daysLeft} дн.)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/clients/${client.id}`)}
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/clients/${client.id}/edit`)}
                              title="Редактировать"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Удалить">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                              title="Удалить клиента?"
                              description={`Клиент ${client.lastName} ${client.firstName} и все его данные будут удалены безвозвратно.`}
                              confirmText="Удалить"
                              onConfirm={() => handleDelete(client.id)}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
