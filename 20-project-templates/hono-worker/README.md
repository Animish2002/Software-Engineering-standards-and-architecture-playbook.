# Template: Hono + Cloudflare Workers

```text
apps/worker/
├── package.json
├── tsconfig.json
├── wrangler.jsonc
├── worker-configuration.d.ts      generated: npx wrangler types
├── .dev.vars.example
└── src/
    ├── index.ts                   fetch / scheduled / queue handlers
    ├── app.ts
    ├── env.ts                     Env + Variables types, config parsing
    ├── db/client.ts               getDb(env) via Hyperdrive (or D1)
    ├── lib/                       errors.ts, response.ts, validate.ts (zValidator wrapper), jwt.ts (jose)
    ├── middleware/                request-context.ts, authenticate.ts, require-permission.ts
    └── modules/
        ├── health/health.routes.ts
        ├── auth/…
        └── items/items.routes.ts, items.service.ts, items.repository.ts, index.ts
```

Files in this folder: [wrangler.jsonc](wrangler.jsonc), [src/index.ts](src/index.ts),
[src/app.ts](src/app.ts), [src/env.ts](src/env.ts), [src/modules/items/items.routes.ts](src/modules/items/items.routes.ts),
[.dev.vars.example](.dev.vars.example).

## Commands

```bash
npm i hono @hono/zod-validator zod drizzle-orm postgres jose
npm i -D wrangler @cloudflare/workers-types typescript vitest @cloudflare/vitest-pool-workers
npx wrangler types
npx wrangler dev
npx wrangler secret put JWT_SECRET --env production
npx wrangler deploy --env production
```

Standards: [08-hono/](../../08-hono/README.md), [09-cloudflare/](../../09-cloudflare/README.md).
