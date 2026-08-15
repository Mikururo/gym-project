
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ClientFormPage } from '@/pages/ClientFormPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { VisitsPage } from '@/pages/VisitsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { UserRole } from '@/types/shared'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/clients', element: <ClientsPage /> },
          { path: '/clients/:id', element: <ClientDetailPage /> },
          {
            element: <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.TRAINER]} />,
            children: [
              { path: '/clients/new', element: <ClientFormPage mode="create" /> },
              { path: '/clients/:id/edit', element: <ClientFormPage mode="edit" /> },
            ],
          },
          { path: '/subscriptions', element: <SubscriptionsPage /> },
          { path: '/visits', element: <VisitsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])

export const Router = () => <RouterProvider router={router} />
