import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as gymApi from '@/api/gym.api'
import type { CreateSubscriptionDto, UpdateSubscriptionDto } from '@/types/shared'

export const SUBSCRIPTION_KEYS = {
  all: ['subscriptions'] as const,
  expiring: ['subscriptions', 'expiring'] as const,
}

export const useSubscriptions = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.all,
    queryFn: gymApi.getSubscriptions,
  })
}

export const useExpiringSubscriptions = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.expiring,
    queryFn: gymApi.getExpiringSubscriptions,
    refetchInterval: 5 * 60 * 1000, // обновляем каждые 5 минут
  })
}

export const useCreateSubscription = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSubscriptionDto) => gymApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all })
    },
  })
}

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionDto }) =>
      gymApi.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all })
    },
  })
}

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gymApi.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all })
    },
  })
}
