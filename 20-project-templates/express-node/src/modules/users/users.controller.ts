import type { Request, Response } from 'express';
import { createUserSchema, updateUserSchema, idParamSchema, offsetQuerySchema } from '@app/validation';
import { ok } from '../../lib/response.js';
import { paginate } from '../../lib/pagination.js';
import { logAction } from '../audit/index.js';
import * as usersService from './users.service.js';

const audit = (req: Request, action: string, detail?: unknown) =>
  void logAction({ actorUserId: req.user!.id, actorName: req.user!.name, action, detail, ip: req.ip });

export async function directory(req: Request, res: Response) {
  res.json(ok(await usersService.directory(req.user!.id)));
}

export async function list(req: Request, res: Response) {
  const q = offsetQuerySchema.parse(req.query);
  const { items, total } = await usersService.list(q);
  res.json(ok(paginate(items, total, q)));
}

export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body);
  const user = await usersService.create(req.user!, input);
  audit(req, 'user.created', { id: user.id, email: user.email });
  res.status(201).json(ok(user));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateUserSchema.parse(req.body);
  const user = await usersService.update(req.user!, id, input);
  audit(req, 'user.updated', { id, fields: Object.keys(input) });
  res.json(ok(user));
}

export async function trash(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const user = await usersService.trash(req.user!, id);
  audit(req, 'user.trashed', { id });
  res.json(ok(user));
}

export async function restore(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const user = await usersService.restore(req.user!, id);
  audit(req, 'user.restored', { id });
  res.json(ok(user));
}
