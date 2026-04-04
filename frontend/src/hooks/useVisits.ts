import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as gymApi from '@/api/gym.api'
import type { CreateVisitDto } from '@/types/shared'

export const VISIT_KEYS = {
  all: ['visits'] as const,
  list: (params: object) => ['visits', 'list', params] as const,
}

export const useVisits = (params: { clientId?: string; date?: string; trainerId?: string } = {}) => {
  return useQuery({
    queryKey: VISIT_KEYS.list(params),
    queryFn: () => gymApi.getVisits(params),
  })
}

export const useCreateVisit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVisitDto) => gymApi.createVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
    },
  })
}

export const useDeleteVisit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gymApi.deleteVisit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
    },
  })
}
