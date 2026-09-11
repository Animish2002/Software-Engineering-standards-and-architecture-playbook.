# 20 — Project templates

Starting structures with minimal real files. Each template is the
smallest thing that follows the playbook; grow it by adding modules, not
by adding layers.

| Template | Use | Contents |
| --- | --- | --- |
| [react-vite/](react-vite/README.md) | A React SPA with Tailwind v4 + shadcn, feature folders, API layer | `vite.config.ts`, `src/main.tsx`, `src/app/router.tsx`, `src/lib/http.ts`, folder skeleton |
| [express-node/](express-node/README.md) | A Node + Express 5 API with feature modules | `src/app.ts`, `src/server.ts`, `src/config.ts`, one module, middleware, Dockerfile |
| [hono-worker/](hono-worker/README.md) | A Hono API on Cloudflare Workers | `wrangler.jsonc`, `src/index.ts`, `src/app.ts`, one module |
| [drizzle-postgres/](drizzle-postgres/README.md) | The `packages/db` package: schema, client, migrations, seeds, check script | `drizzle.config.ts`, `src/schema/*`, `src/client.ts`, scripts |
| [fullstack/](fullstack/README.md) | The monorepo that combines the above | Root `package.json`, workspace layout, shared packages, CI |

## How to use a template

1. Copy the folder into the new repo (or copy `fullstack/` and prune).
2. Rename `@app/*` package names to the project's scope.
3. Run the new-project checklist ([21-checklists/new-project-checklist.md](../21-checklists/new-project-checklist.md)).
4. Replace the example module (`items`/`users`) with the first real feature.
5. Delete what you don't use. Keep templates minimal in this repo too: if a
   file isn't needed by every project, it belongs in
   [19-reusable-patterns/](../19-reusable-patterns/README.md) instead.

Files here are reference skeletons, not installed projects; they are not
built or tested in this repository.
