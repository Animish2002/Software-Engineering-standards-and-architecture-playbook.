# Feature-based architecture

## What is it?

The top-level folders are business features (`auth`, `users`, `orders`,
`shares`), and each feature folder contains everything that feature needs:
routes, controller, service, repository, schemas, tests on the backend;
components, hooks, API functions, types on the frontend.

## Why does it matter?

Changes are almost always feature-scoped. When a feature's code sits in one
folder, a change touches one place, ownership is obvious, and deleting the
feature is `rm -r`. When it is spread across `controllers/`, `services/`,
`components/`, `hooks/`, every change is a scavenger hunt.

## When should I use it?

From the start of any app that will have more than a handful of screens or
endpoints. The overhead at two features is one extra folder level.

## When should I NOT use it?

- Scripts and tiny services with one concern.
- When "features" would be technical (`validation`, `email`). Those are infrastructure and go in `lib/`.

## Recommended approach

### Backend

```text
src/
├── modules/
│   ├── users/
│   │   ├── index.ts
│   │   ├── users.routes.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── users.schema.ts
│   │   └── users.types.ts
│   └── orders/
│       └── ...
├── middleware/        authenticate, requirePermission, requestLogger, errorHandler
├── lib/               errors, logger, jwt, response, ids  (no business rules)
├── db/                client, schema re-exports, migrations config
├── config.ts
├── app.ts
└── server.ts
```

### Frontend

```text
src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx
│   └── layouts/
├── features/
│   ├── auth/
│   │   ├── components/   LoginForm.tsx
│   │   ├── hooks/        useLogin.ts
│   │   ├── api.ts        login(), logout()  → typed calls via lib/http
│   │   ├── types.ts
│   │   └── index.ts      public surface
│   └── users/
│       └── ...
├── components/
│   ├── ui/               shadcn primitives
│   ├── common/           EmptyState, ErrorState, PageHeader, ConfirmDialog
│   └── forms/            FormField wrappers
├── hooks/                cross-feature hooks (useMediaQuery, useDebounce)
├── lib/                  http client, api-cache, format, cn
├── pages/                thin route components that compose features (optional; may live in features)
└── main.tsx
```

### What goes where

| Question | Answer |
| --- | --- |
| Used by one feature? | Inside that feature folder. |
| Used by two features? | Still inside the owning feature; the other imports from its `index.ts`. |
| Used by three or more, no business meaning? | `components/common`, `hooks/`, `lib/`. |
| A UI primitive (button, dialog)? | `components/ui` (shadcn). |
| A page that composes several features? | `pages/` or `app/routes/`, kept thin. |

## Bad example

```text
src/
├── components/      120 files, all features mixed
├── hooks/           60 files
├── services/        40 files
└── utils/           80 files
```

Nobody can tell which files belong to "orders" without grepping.

## Common mistakes

- Feature folders on the backend but type folders on the frontend (or vice versa). Mirror them; the feature names should match across the stack.
- Putting shared UI in a feature "because it was written there first". Promote it when the third feature needs it.
- Over-nesting: `features/users/components/tables/UserTable/UserTable.tsx`. Flat until it hurts.
- A `shared/` feature that becomes the new dumping ground.

## Checklist

- [ ] Top-level folders are business concepts.
- [ ] Each feature exposes an `index.ts`.
- [ ] Cross-feature imports go through `index.ts`.
- [ ] Infrastructure has no business rules.
- [ ] Feature names match between API and web.

## Related

- [modular-monolith.md](modular-monolith.md)
- [02-backend/code-organization.md](../02-backend/code-organization.md)
- [10-frontend/project-structure.md](../10-frontend/project-structure.md)
