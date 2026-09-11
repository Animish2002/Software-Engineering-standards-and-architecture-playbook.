# Hono routing

## Sub-apps per module

```ts
// modules/items/items.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../../env';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/require-permission';
import { createFolderSchema, idParamSchema, listQuerySchema } from '@app/validation';
import * as items from './items.service';
import { ok } from '../../lib/response';

export const itemsRoutes = new Hono<AppEnv>()
  .use('*', authenticate)
  .get('/items', zValidator('query', listQuerySchema), async (c) => {
    const { folderId } = c.req.valid('query');
    const user = c.get('user')!;
    return c.json(ok(await items.listChildren(c.env, user.id, folderId ?? null)));
  })
  .post('/folders', requirePermission('folder:create'), zValidator('json', createFolderSchema), async (c) => {
    const input = c.req.valid('json');
    const folder = await items.createFolder(c.env, c.get('user')!.id, input);
    return c.json(ok(folder), 201);
  })
  .post('/items/:id/trash', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    return c.json(ok(await items.trash(c.env, c.get('user')!.id, id)));
  });
```

Chaining (`new Hono().get().post()`) keeps the route types for the RPC
client; assign the chained result to the export.

## Params, query, headers

- `c.req.param('id')`, `c.req.query('folderId')`, `c.req.header('authorization')`.
- Prefer `zValidator` so values are typed and validated in one step ([validation.md](validation.md)).

## Path patterns

- `/users/:id`, `/files/:id{[0-9a-f-]+}` (regex constraint), `/static/*` wildcard.
- Order matters within an app: specific before wildcard.

## Grouping and mounting

```ts
app.route('/api/users', usersRoutes);   // prefix mounting
app.basePath('/api');                    // alternatively set a base path once
```

## RPC client (optional, first-party frontend only)

```ts
// worker: export the app type
export type AppType = typeof app;

// web
import { hc } from 'hono/client';
const client = hc<AppType>(import.meta.env.VITE_API_URL);
const res = await client.api.folders.$post({ json: { name: 'Q3', parentId: null } });
```

End-to-end types with no codegen. Still wrap it in the frontend's API
layer so pages don't call the client directly
([10-frontend/api-integration.md](../10-frontend/api-integration.md)).

## Related

- [middleware.md](middleware.md)
- [05-apis/resource-naming.md](../05-apis/resource-naming.md)
