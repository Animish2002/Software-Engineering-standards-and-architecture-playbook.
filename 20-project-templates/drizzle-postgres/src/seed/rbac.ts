/**
 * Reconciling reference-data seed. Safe to run on every deploy in every environment:
 * - inserts missing permissions and roles
 * - grants keys listed here; REVOKES grants no longer listed (so removing a key from a role takes effect)
 * - never touches user rows
 */
import { eq, inArray, notInArray, and } from 'drizzle-orm';
import { db, pool } from '../client.js';
import { permissions, roles, rolePermissions } from '../schema/index.js';

const EMPLOYEE_KEYS = ['file:upload', 'file:delete', 'file:rename', 'file:move', 'file:download', 'file:share', 'folder:create', 'folder:delete', 'trash:restore'];
export const ROLE_PERMISSION_KEYS: Record<string, string[]> = {
  Employee: EMPLOYEE_KEYS,
  Admin: [...EMPLOYEE_KEYS, 'user:manage'],
  'Super Admin': [...EMPLOYEE_KEYS, 'user:manage', 'admin:manage', 'audit:view', 'system:health'],
};

export async function seedRbac() {
  const allKeys = [...new Set(Object.values(ROLE_PERMISSION_KEYS).flat())];

  await db.transaction(async (tx) => {
    await tx.insert(permissions).values(allKeys.map((key) => ({ key }))).onConflictDoNothing({ target: permissions.key });
    await tx.insert(roles).values(Object.keys(ROLE_PERMISSION_KEYS).map((name) => ({ name }))).onConflictDoNothing({ target: roles.name });

    const permRows = await tx.select().from(permissions).where(inArray(permissions.key, allKeys));
    const roleRows = await tx.select().from(roles);
    const permIdByKey = new Map(permRows.map((p) => [p.key, p.id]));

    for (const role of roleRows) {
      const wanted = (ROLE_PERMISSION_KEYS[role.name] ?? []).map((k) => permIdByKey.get(k)!);
      if (wanted.length) {
        await tx.insert(rolePermissions).values(wanted.map((permissionId) => ({ roleId: role.id, permissionId }))).onConflictDoNothing();
        await tx.delete(rolePermissions).where(and(eq(rolePermissions.roleId, role.id), notInArray(rolePermissions.permissionId, wanted)));
      } else {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      }
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedRbac().then(() => { console.log('rbac seeded'); return pool.end(); }).catch((err) => { console.error(err); process.exit(1); });
}
