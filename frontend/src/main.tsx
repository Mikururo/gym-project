import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Router } from './router'
import { Toaster } from '@/components/ui/toaster'
import { useAuthStore } from '@/store/authStore'
import './index.css'

// ─── Настройка React Query ─────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,       // Данные свежие 30 секунд
      retry: 1,                    // Одна попытка повтора при ошибке
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    },
  },
})

// ─── Инициализация приложения ─────────────────────────────────────────────
const App = () => {
  const checkAuth = useAuthStore(s => s.checkAuth)

  React.useEffect(() => {
    // Проверяем авторизацию при запуске
    checkAuth()
  }, [checkAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
