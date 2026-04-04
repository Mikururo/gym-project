import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/api/gym.api'

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    refetchInterval: 60 * 1000, // обновляем раз в минуту
    staleTime: 30 * 1000,
  })
}
