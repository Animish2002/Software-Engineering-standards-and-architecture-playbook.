import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/app/layouts/AppLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { LoadingState } from '@/components/common/states';
import { RouteErrorState } from '@/components/common/route-error-state';

const page = (load: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(load);
  return (
    <Suspense fallback={<LoadingState variant="page" />}>
      <C />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorState />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: 'home', element: page(() => import('@/pages/HomePage')) },
          {
            element: <RequirePermission permission="user:manage" />,
            children: [{ path: 'users', element: page(() => import('@/pages/users/UsersPage')) }],
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [{ path: 'login', element: page(() => import('@/pages/LoginPage')) }],
  },
  { path: '*', element: page(() => import('@/pages/NotFoundPage')) },
]);
