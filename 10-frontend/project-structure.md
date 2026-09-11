# Frontend project structure

```text
apps/web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── components.json            shadcn config
├── public/                    favicon, _headers, _redirects
└── src/
    ├── main.tsx               createRoot, providers, router
    ├── app/
    │   ├── router.tsx         route tree; lazy pages
    │   ├── providers.tsx      QueryClient/Cache, CurrentUser, Theme, Toaster
    │   └── layouts/
    │       ├── AppLayout.tsx  sidebar + header + <Outlet/>
    │       └── AuthLayout.tsx centered card for login/reset
    ├── pages/                 thin route components (optional; can live in features)
    │   ├── DrivePage.tsx
    │   ├── SharedPage.tsx
    │   └── users/UsersPage.tsx
    ├── features/
    │   ├── auth/
    │   │   ├── components/LoginForm.tsx
    │   │   ├── hooks/useLogin.ts
    │   │   ├── api.ts                   login(), logout(), me()
    │   │   └── index.ts
    │   ├── items/
    │   │   ├── components/DriveItemGrid.tsx, DriveItemList.tsx, FileThumbnail.tsx, Breadcrumbs.tsx, UploadProgressPanel.tsx
    │   │   ├── hooks/useDriveView.ts, useUpload.ts
    │   │   ├── api.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── shares/
    │   └── users/
    ├── components/
    │   ├── ui/                shadcn primitives (button, dialog, table, …) — generated, minimally edited
    │   ├── common/            EmptyState, ErrorState, LoadingState, PageHeader, ConfirmDialog, DataTable pieces, Pagination
    │   ├── forms/             FormField wrappers around shadcn Form, FieldError
    │   └── auth/              RequirePermission, RequireAuth
    ├── hooks/                 useMediaQuery, useDebouncedValue, useDisclosure
    ├── lib/
    │   ├── http.ts            fetch wrapper: base URL, auth header, refresh-on-401, envelope parsing
    │   ├── api/               typed functions per resource (or feature-local api.ts; pick one)
    │   ├── api-cache.ts       (if hand-rolled) or query-client.ts (TanStack)
    │   ├── current-user.tsx   provider + hook
    │   ├── permissions.ts     hasPermission()
    │   ├── format.ts          bytes, dates, numbers
    │   ├── cn.ts              clsx + tailwind-merge
    │   └── constants.ts
    ├── styles/
    │   └── globals.css        Tailwind v4 @import, @theme tokens, shadcn variables
    └── types/                 ambient types (vite-env.d.ts)
```

## Where does X go?

| X | Location |
| --- | --- |
| A component used by one feature | `features/<f>/components/` |
| A component used by 3+ features with no business meaning | `components/common/` |
| A shadcn primitive | `components/ui/` (via CLI) |
| A hook that calls the API | `features/<f>/hooks/` |
| A hook with no feature knowledge (`useDebouncedValue`) | `hooks/` |
| API call functions | `features/<f>/api.ts` **or** `lib/api/<resource>.ts`; one convention per project |
| Types that the API also uses | `packages/shared-types` |
| Zod schemas the API also uses | `packages/validation` |
| Formatting helpers | `lib/format.ts` |
| Route guards | `components/auth/` |
| Page chrome | `app/layouts/` |

## Naming

- Components `PascalCase.tsx`, one exported component per file.
- Hooks `useThing.ts`.
- Everything else `kebab-case.ts`.
- Feature names match API module names.

## Keep it flat

`features/items/components/DriveItemGrid.tsx`, not
`features/items/components/grid/DriveItemGrid/DriveItemGrid.tsx`. Add a
subfolder only when a folder exceeds ~15 files.

## Related

- [architecture.md](architecture.md)
- [20-project-templates/react-vite/](../20-project-templates/react-vite/README.md)
