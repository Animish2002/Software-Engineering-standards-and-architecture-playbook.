import { Hono } from 'hono';
import type { AppEnv } from '../../env';
import { zValidator } from '../../lib/validate';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/require-permission';
import { createFolderSchema, idParamSchema, listQuerySchema } from '@app/validation';
import * as items from './items.service';

export const itemsRoutes = new Hono<AppEnv>()
  .use('*', authenticate)
  .get('/items', zValidator('query', listQuerySchema), async (c) => {
    const { folderId } = c.req.valid('query');
    return c.json(ok(await items.listChildren(c.env, c.get('user')!.id, folderId ?? null)));
  })
  .post('/folders', requirePermission('folder:create'), zValidator('json', createFolderSchema), async (c) => {
    const folder = await items.createFolder(c.env, c.get('user')!.id, c.req.valid('json'));
    return c.json(ok(folder), 201);
  })
  .post('/items/:id/trash', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const user = c.get('user')!;
    const item = await items.trash(c.env, user, id);          // permission key depends on item kind; checked in the service
    return c.json(ok(item));
  });
