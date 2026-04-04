import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as gymApi from '@/api/gym.api'
import type { CreateClientDto, UpdateClientDto } from '@/types/shared'

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  list: (params: object) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
}

export const useClients = (params: { page?: number; limit?: number; search?: string } = {}) => {
  return useQuery({
    queryKey: CLIENT_KEYS.list(params),
    queryFn: () => gymApi.getClients(params),
    placeholderData: (prev) => prev,
  })
}

export const useClient = (id: string) => {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => gymApi.getClientById(id),
    enabled: !!id,
  })
}

export const useCreateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientDto) => gymApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
    },
  })
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      gymApi.updateClient(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) })
    },
  })
}

export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gymApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all })
    },
  })
}
