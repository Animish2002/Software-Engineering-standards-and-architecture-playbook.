# Template: Node + Express 5

```text
apps/api/
├── package.json
├── tsconfig.json
├── Dockerfile                          (13-docker/dockerfile.md)
├── .env.example                        (root-level in a monorepo)
├── src/
│   ├── config.ts                       (19-reusable-patterns/backend/env-config.md)
│   ├── app.ts
│   ├── server.ts
│   ├── routes.ts
│   ├── types/express.d.ts
│   ├── lib/
│   │   ├── errors.ts                   (19-reusable-patterns/backend/http-errors.md)
│   │   ├── response.ts                 (19-reusable-patterns/backend/response-envelope.md)
│   │   ├── logger.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── pagination.ts               (19-reusable-patterns/backend/pagination.md)
│   ├── middleware/
│   │   ├── request-context.ts
│   │   ├── authenticate.ts
│   │   ├── require-permission.ts
│   │   ├── rate-limit.ts
│   │   ├── not-found.ts
│   │   └── error-handler.ts
│   └── modules/
│       ├── health/
│       │   ├── health.routes.ts
│       │   └── index.ts
│       ├── auth/
│       │   ├── auth.routes.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   └── index.ts
│       └── users/
│           ├── users.routes.ts
│           ├── users.controller.ts
│           ├── users.service.ts
│           ├── users.repository.ts
│           ├── users.service.test.ts
│           └── index.ts
└── tests/api/                          Playwright request tests
```

Files in this folder: [package.json](package.json), [src/app.ts](src/app.ts),
[src/server.ts](src/server.ts), [src/routes.ts](src/routes.ts),
[src/modules/users/users.routes.ts](src/modules/users/users.routes.ts),
[src/modules/users/users.controller.ts](src/modules/users/users.controller.ts),
[src/modules/users/users.service.ts](src/modules/users/users.service.ts),
[src/modules/users/index.ts](src/modules/users/index.ts).

Copy the middleware and lib files from [19-reusable-patterns/backend/](../../19-reusable-patterns/backend/README.md).

Standards: [02-backend/](../../02-backend/README.md), [07-express/](../../07-express/README.md), [06-nodejs/](../../06-nodejs/README.md).
