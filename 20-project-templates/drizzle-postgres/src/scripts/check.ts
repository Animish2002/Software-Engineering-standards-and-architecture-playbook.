/**
 * Read-only status report for DATABASE_URL. Writes nothing.
 * Answers "is this environment actually migrated?" without a SQL client.
 */
import { readdirSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db, pool } from '../client.js';
import { ROLE_PERMISSION_KEYS } from '../seed/rbac.js';

/** Keep in sync with every migration that adds an index. The API runs from dist/, so the .sql files aren't available there. */
export const EXPECTED_INDEXES = [
  'uq_users_email_lower',
  'uq_refresh_tokens_hash', 'idx_refresh_tokens_user', 'idx_refresh_tokens_expires',
  'idx_role_permissions_permission', 'idx_user_roles_role',
];

async function main() {
  const migrationsDir = new URL('../../drizzle', import.meta.url);
  const onDisk = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const applied = await db.execute<{ hash: string; created_at: string }>(sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at`).catch(() => ({ rows: [] as { hash: string }[] }));

  const idx = await db.execute<{ indexname: string }>(sql`select indexname from pg_indexes where schemaname = 'public'`);
  const present = new Set(idx.rows.map((r) => r.indexname));
  const missingIndexes = EXPECTED_INDEXES.filter((n) => !present.has(n));

  const wantedKeys = [...new Set(Object.values(ROLE_PERMISSION_KEYS).flat())];
  const keys = await db.execute<{ key: string }>(sql`select key from permissions`);
  const have = new Set(keys.rows.map((r) => r.key));
  const missingKeys = wantedKeys.filter((k) => !have.has(k));

  console.log(JSON.stringify({
    migrations: { onDisk: onDisk.length, applied: applied.rows.length, pending: Math.max(0, onDisk.length - applied.rows.length) },
    indexes: { expected: EXPECTED_INDEXES.length, missing: missingIndexes },
    permissions: { expected: wantedKeys.length, missing: missingKeys },
    status: missingIndexes.length || missingKeys.length || onDisk.length !== applied.rows.length ? 'degraded' : 'ok',
  }, null, 2));
}

main().then(() => pool.end()).catch((err) => { console.error(err); process.exit(1); });
