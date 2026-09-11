# Dependency management

## What is it?

Two related things: (1) the direction code inside the project is allowed to
import, and (2) how third-party packages are chosen, pinned, and updated.

## Internal dependencies

### Direction

```text
apps/web  ─┐
           ├─►  packages/shared-types, packages/validation
apps/api  ─┘         ▲
                     │
             packages/db, packages/storage  (api only)
```

- Apps depend on packages. Packages never depend on apps.
- Packages depend on other packages only in one direction (`db` may import `shared-types`; `shared-types` imports nothing).
- Inside an app: routes → controllers → services → repositories → db (see [layered-architecture.md](layered-architecture.md)); modules import each other only via `index.ts` ([modular-monolith.md](modular-monolith.md)).

### Monorepo with npm workspaces

```json
// package.json (root)
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "npm run dev -w apps/api",
    "dev:web": "npm run dev -w apps/web",
    "build": "npm run build -ws --if-present",
    "test": "npm run test -ws --if-present",
    "lint": "npm run lint -ws --if-present"
  }
}
```

- npm workspaces are enough for one team; Turborepo/Nx add caching that matters only when builds take minutes.
- Packages export from `src/` in development and `dist/` in production, or are built first in CI. Put the build order in the root script (`build:packages` before `build:api`).
- Path aliases (`@/`) are per-app; cross-app imports go through package names.

### Cycles

A cycle (A imports B imports A) means the boundary is wrong. Move the shared
piece down (to `lib/` or a package) or invert with an event/callback. Detect
with `madge --circular src` or ESLint `import/no-cycle`.

## Third-party dependencies

### Choosing

Before adding a package, answer:

1. Does the platform already do this? (`fetch`, `crypto.randomUUID`, `structuredClone`, `Array.prototype.at`, `node:test`, `node --env-file`.)
2. Is it maintained (recent releases, open issues answered)?
3. How big is it and what does it pull in? (`npm view <pkg> dependencies`, bundlephobia for frontend.)
4. What is its license?

Prefer boring, widely used packages: `zod`, `pino`, `drizzle-orm`,
`@tanstack/react-query`, `react-hook-form`, `date-fns`.

### Pinning and updating

- Commit the lockfile. CI uses `npm ci`, never `npm install`.
- Use caret ranges in `package.json` (default) but rely on the lockfile for reproducibility.
- Update on a schedule (Dependabot/Renovate weekly, grouped), not ad hoc. Read changelogs for majors.
- `npm audit` in CI at `high` severity; fix or explicitly accept with a note.
- Dev tooling (ESLint, Prettier, TypeScript) stays current; runtime dependencies move deliberately.

### Placement

| Package kind | Where |
| --- | --- |
| Used at runtime by the app | `dependencies` of that app |
| Build/lint/test tooling | `devDependencies` (root for shared tooling, app for app-specific) |
| Types (`@types/*`) | `devDependencies` |
| Shared runtime (zod) | `dependencies` of the package that uses it; apps get it transitively |

## Common mistakes

- Apps importing from each other (`apps/web` importing `apps/api/src/types`). Move to a package.
- Deep imports into a package's internals; export a public surface.
- Adding lodash for one function that `Array.prototype` provides.
- `npm install` in CI, which can silently change the lockfile.
- Never updating; then a security fix forces three majors at once.

## Checklist

- [ ] Import direction: apps → packages; never packages → apps.
- [ ] No circular imports (checked in CI).
- [ ] Lockfile committed; CI uses `npm ci`.
- [ ] Dependency updates are scheduled and grouped.
- [ ] Every new package has a one-line justification in the PR.

## Related

- [modular-monolith.md](modular-monolith.md)
- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
- [15-security/security-checklist.md](../15-security/security-checklist.md)
