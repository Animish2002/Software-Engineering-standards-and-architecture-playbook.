# Node.js project structure

The module/feature layout is in [02-backend/architecture.md](../02-backend/architecture.md).
This page covers the service-level scaffolding around it.

```text
apps/api/
├── package.json
├── tsconfig.json
├── src/
│   ├── config.ts
│   ├── app.ts            createApp()
│   ├── server.ts         entrypoint: listen + signals
│   ├── worker.ts         optional second entrypoint (jobs), same code
│   ├── modules/
│   ├── middleware/
│   ├── lib/
│   └── db/
├── tests/
│   └── api/              black-box HTTP tests against a running server
├── Dockerfile
└── .env.example          (root-level in a monorepo)
```

## `package.json`

```json
{
  "name": "@app/api",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "tsx watch --env-file=../../.env.local src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:api": "playwright test -c tests/api"
  }
}
```

- `dev` runs TypeScript directly with `tsx`; `start` runs compiled JS. Never run `tsx` in production (slower start, no type errors surfaced at build).
- `build` emits to `dist/`; the Dockerfile copies `dist/` and production `node_modules` only.

## `tsconfig.json` (service)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`paths` aliases need a runtime resolver for compiled output; either avoid
them in the API (relative imports are fine at module depth ≤ 3), or use
`tsc-alias`/subpath `imports` in `package.json` (`"imports": { "#lib/*": "./dist/lib/*.js" }`), which Node resolves natively.

## `server.ts`

```ts
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { pool } from '@app/db';

const app = createApp();
const server = app.listen(config.PORT, () => logger.info({ port: config.PORT, env: config.NODE_ENV }, 'listening'));
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;

const shutdown = (signal: string) => { /* see graceful-shutdown.md */ };
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => { logger.fatal({ err }, 'unhandledRejection'); process.exit(1); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaughtException'); process.exit(1); });
```

## Monorepo build order

Packages (`shared-types`, `validation`, `db`, `storage`) must be built or
resolvable before `apps/api` builds. Either point package `exports` at
`src` and let `tsx`/bundler resolve TS, or build packages first in CI
(`npm run build -w packages/db` before `-w apps/api`). Railpack/Nixpacks
style builders need the root install + explicit build command; see
[18-devops/ci-cd.md](../18-devops/ci-cd.md).

## Related

- [modules.md](modules.md)
- [13-docker/dockerfile.md](../13-docker/dockerfile.md)
- [20-project-templates/express-node/](../20-project-templates/express-node/README.md)
