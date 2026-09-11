# Express controllers

Rules in [02-backend/layers.md](../02-backend/layers.md). Express shape:

```ts
// modules/items/items.controller.ts
import type { Request, Response } from 'express';
import { ok } from '../../lib/response.js';
import { createFolderSchema, idParamSchema, listQuerySchema } from '@app/validation';
import * as itemsService from './items.service.js';
import { logAction } from '../audit/index.js';

const audit = (req: Request, action: string, detail?: unknown) =>
  void logAction({ actorUserId: req.user!.id, actorName: req.user!.name, action, detail });

export async function listChildren(req: Request, res: Response) {
  const { folderId } = listQuerySchema.parse(req.query);
  const items = await itemsService.listChildren(req.user!.id, folderId ?? null);
  res.json(ok(items));
}

export async function createFolder(req: Request, res: Response) {
  const input = createFolderSchema.parse(req.body);
  const folder = await itemsService.createFolder(req.user!.id, input);
  audit(req, 'folder.created', { id: folder.id, name: folder.name });
  res.status(201).json(ok(folder));
}

export async function trash(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const kind = await itemsService.getItemKind(req.user!.id, id);     // needed to pick the permission key
  assertPermission(req.user!, kind === 'folder' ? 'folder:delete' : 'file:delete');
  const item = await itemsService.trash(req.user!.id, id);
  audit(req, 'item.trashed', { id, kind });
  res.json(ok(item));
}
```

## Conventions

- Named exports per handler; the routes file maps paths to them.
- Express 5: async handlers need no wrapper. On Express 4, wrap with `asyncHandler` ([19-reusable-patterns/backend/async-handler.md](../19-reusable-patterns/backend/async-handler.md)).
- `req.user!` after `authenticate`; if a route is optionally authenticated, check explicitly.
- Parse with Zod; let `ZodError` propagate to the error middleware.
- Status codes: 201 for create, 200 otherwise, 204 only where the body is truly empty.
- Audit in the controller (actor known here), fire-and-forget.
- Composite endpoints call several services and assemble the response; still no rules here.

## Cookies (auth controller)

```ts
res.cookie('refresh_token', token, { httpOnly: true, secure: config.isProd, sameSite: 'lax', path: '/auth', maxAge: 30 * 86_400_000 });
res.clearCookie('refresh_token', { path: '/auth' });
```

## Don't

- Access `db` or Drizzle tables.
- `try/catch` to map errors to status codes.
- Read `userId` from `req.body`.
- Build `{ success: true, data }` by hand.

## Related

- [services.md](services.md)
- [validation.md](validation.md)
