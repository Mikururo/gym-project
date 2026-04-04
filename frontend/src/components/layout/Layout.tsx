import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

// Заголовки страниц по маршруту
const pageTitles: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/clients': 'Клиенты',
  '/subscriptions': 'Абонементы',
  '/visits': 'Посещения',
  '/users': 'Пользователи',
  '/profile': 'Профиль',
}

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Определяем заголовок страницы
  const path = Object.keys(pageTitles).find((key) => location.pathname.startsWith(key)) ?? ''
  const pageTitle = pageTitles[path]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Оверлей для мобильных */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Боковое меню — десктоп */}
      <aside className="hidden w-64 shrink-0 md:flex md:flex-col">
        <Sidebar />
      </aside>

      {/* Боковое меню — мобильное (выезжающее) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Основной контент */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
