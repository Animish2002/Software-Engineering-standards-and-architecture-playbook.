# Routing (React Router)

## Route tree

- Declared in one file (`app/router.tsx`), pages lazy-loaded.
- Layout routes for chrome ([layouts.md](layouts.md)).
- Guard routes: `RequireAuth` (redirects to `/login` with `returnTo`), `RequirePermission` (renders a 403 state or redirects).
- URL is state: folder id, page, filters, sort live in the path or search params, so links and refresh work.

```tsx
export const router = createBrowserRouter([
  { element: <RequireAuth />, children: [
    { element: <AppLayout />, errorElement: <RouteErrorState />, children: [
      { index: true, element: <Navigate to="/drive" replace /> },
      { path: 'drive/:folderId?', element: lazyPage(() => import('@/pages/DrivePage')) },
      { path: 'shared', element: lazyPage(() => import('@/pages/SharedPage')) },
      { element: <RequirePermission permission="user:manage" />, children: [
        { path: 'users', element: lazyPage(() => import('@/pages/users/UsersPage')) },
        { path: 'users/audit-log', element: lazyPage(() => import('@/pages/users/AuditLogPage')) },
      ]},
    ]},
  ]},
  { element: <AuthLayout />, children: [
    { path: 'login', element: lazyPage(() => import('@/pages/LoginPage')) },
    { path: 'reset-password', element: lazyPage(() => import('@/pages/ResetPasswordPage')) },
  ]},
  { path: 'shared/:token', element: lazyPage(() => import('@/pages/PublicSharePage')) },   // no auth
  { path: '*', element: <NotFoundPage /> },
]);
```

## Data: loaders vs hooks

| Approach | Use when |
| --- | --- |
| **Hooks in the page/feature** (`useDriveView(folderId)`) with a cache | Default for SPAs talking to a JSON API; keeps caching/revalidation in one layer; instant back navigation |
| Router loaders (`loader:`) | You want data fetching to start before the component renders and are happy managing caching separately, or you're using a framework mode with SSR |

Pick one for the project. Mixing makes cache behaviour hard to reason about.

## Search params

```ts
const [params, setParams] = useSearchParams();
const page = Number(params.get('page') ?? 1);
setParams((p) => { p.set('page', String(next)); return p; }, { replace: true });
```

Wrap in a `useQueryState(key, schema)` hook so parsing/defaults live once.

## Navigation after mutations

- Create → navigate to the new resource or stay and mark the list stale.
- Delete → navigate up (to the parent) and mark stale.
- Use `replace: true` for redirects the user shouldn't back into (login → app).

## Guards

```tsx
export function RequirePermission({ permission }: { permission: string }) {
  const { permissionKeys } = useCurrentUser();
  if (!hasPermission(permissionKeys, permission)) return <ForbiddenState />;
  return <Outlet />;
}
```

Frontend guards are UX. The API enforces.

## Related

- [layouts.md](layouts.md)
- [state-management.md](state-management.md)
