import type { CreateUserInput, UpdateUserInput } from '@app/validation';
import type { AuthUser } from '../../types/express.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { hashPassword } from '../../lib/password.js';
import { hasPermission } from '../../middleware/require-permission.js';
import { logger } from '../../lib/logger.js';
import { sendWelcomeEmail } from '../../lib/email.js';
import * as usersRepo from './users.repository.js';
import * as rolesRepo from '../rbac/roles.repository.js';

const ADMIN_TIER = new Set(['Admin', 'Super Admin']);

/** Managing an admin-tier account requires admin:manage, not just user:manage. */
async function assertCanManage(actor: AuthUser, targetRoleName: string) {
  if (ADMIN_TIER.has(targetRoleName) && !hasPermission(actor, 'admin:manage')) throw new ForbiddenError('Managing admin accounts requires admin:manage');
}

export const directory = (callerId: string) => usersRepo.listActiveExcept(callerId);

export async function list(q: { page: number; pageSize: number }) {
  const [items, total] = await Promise.all([usersRepo.listActive(q), usersRepo.countActive()]);
  return { items, total };
}

export async function create(actor: AuthUser, input: CreateUserInput) {
  const role = await rolesRepo.findById(input.roleId);
  if (!role) throw new NotFoundError('Role', input.roleId);
  await assertCanManage(actor, role.name);
  if (await usersRepo.findByEmailWithHash(input.email)) throw new ConflictError('Email already registered');

  const user = await usersRepo.insert({ email: input.email, name: input.name, passwordHash: await hashPassword(input.password), storageQuotaBytes: input.storageQuotaBytes });
  await rolesRepo.assign(user.id, role.id);

  void sendWelcomeEmail({ to: user.email, name: user.name, temporaryPassword: input.password })
    .catch((err) => logger.warn({ err, userId: user.id }, 'welcome email failed'));   // best-effort: creation succeeded regardless
  return user;
}

export async function update(actor: AuthUser, id: string, input: UpdateUserInput) {
  const target = await usersRepo.findByIdWithRole(id);
  if (!target) throw new NotFoundError('User', id);
  await assertCanManage(actor, target.roleName);
  const updated = await usersRepo.update(id, input);
  if (!updated) throw new NotFoundError('User', id);
  return updated;
}

export async function trash(actor: AuthUser, id: string) {
  if (actor.id === id) throw new ConflictError('You cannot deactivate your own account');
  const target = await usersRepo.findByIdWithRole(id);
  if (!target) throw new NotFoundError('User', id);
  await assertCanManage(actor, target.roleName);
  const updated = await usersRepo.setTrashed(id, true);
  if (!updated) throw new NotFoundError('User', id);
  await usersRepo.revokeAllRefreshTokens(id);            // deactivation ends every session
  return updated;
}

export async function restore(actor: AuthUser, id: string) {
  const target = await usersRepo.findByIdWithRole(id, { includeTrashed: true });
  if (!target) throw new NotFoundError('User', id);
  await assertCanManage(actor, target.roleName);
  const updated = await usersRepo.setTrashed(id, false);
  if (!updated) throw new NotFoundError('User', id);
  return updated;
}
