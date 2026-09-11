# Template: React + Vite

```text
apps/web/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── components.json                 shadcn
├── .env.example                    VITE_API_URL=
├── public/
│   ├── _headers                    security headers (Cloudflare Pages)
│   └── _redirects                  /* /index.html 200
└── src/
    ├── main.tsx
    ├── vite-env.d.ts
    ├── styles/globals.css
    ├── app/
    │   ├── router.tsx
    │   ├── providers.tsx
    │   └── layouts/AppLayout.tsx, AuthLayout.tsx
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── LoginPage.tsx
    │   └── NotFoundPage.tsx
    ├── features/
    │   └── auth/
    │       ├── api.ts
    │       ├── hooks/useLogin.ts
    │       ├── components/LoginForm.tsx
    │       └── index.ts
    ├── components/
    │   ├── ui/                     (npx shadcn add …)
    │   ├── common/states.tsx, page-header.tsx, confirm-dialog.tsx
    │   ├── forms/text-field.tsx
    │   └── auth/RequireAuth.tsx, RequirePermission.tsx
    ├── hooks/use-media-query.ts
    └── lib/
        ├── http.ts                 (19-reusable-patterns/frontend/api-client.md)
        ├── api-cache.ts            (19-reusable-patterns/frontend/use-api-query.md)
        ├── current-user.tsx
        ├── permissions.ts
        ├── format.ts
        └── utils.ts                cn()
```

## Setup commands

```bash
npm create vite@latest apps/web -- --template react-ts
cd apps/web && npm i react-router @tanstack/react-query zod react-hook-form @hookform/resolvers sonner lucide-react
npm i -D tailwindcss @tailwindcss/vite prettier prettier-plugin-tailwindcss eslint-plugin-jsx-a11y vitest jsdom @testing-library/react @testing-library/user-event msw
npx shadcn@latest init
npx shadcn@latest add button dialog alert-dialog dropdown-menu input label form select table skeleton badge tooltip sonner
```

The files below are in this folder: [vite.config.ts](vite.config.ts),
[src/main.tsx](src/main.tsx), [src/app/router.tsx](src/app/router.tsx),
[src/app/providers.tsx](src/app/providers.tsx),
[src/lib/permissions.ts](src/lib/permissions.ts),
[src/lib/current-user.tsx](src/lib/current-user.tsx),
[src/components/auth/RequirePermission.tsx](src/components/auth/RequirePermission.tsx),
[public/_headers](public/_headers), [.env.example](.env.example).

Standards: [10-frontend/](../../10-frontend/README.md), [11-tailwind/](../../11-tailwind/README.md), [12-shadcn/](../../12-shadcn/README.md).
