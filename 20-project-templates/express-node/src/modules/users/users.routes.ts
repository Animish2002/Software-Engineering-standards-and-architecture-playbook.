import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as c from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get('/directory', c.directory);                 // any authenticated user; registered before the admin gate

usersRouter.use(requirePermission('user:manage'));
usersRouter.get('/', c.list);
usersRouter.post('/', c.create);
usersRouter.patch('/:id', c.update);
usersRouter.delete('/:id', c.trash);
usersRouter.post('/:id/restore', c.restore);
