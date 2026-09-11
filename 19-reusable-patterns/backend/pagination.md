# Pagination helpers

```ts
// lib/pagination.ts
import { z } from 'zod';

// ---- offset ----
export const offsetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type OffsetQuery = z.infer<typeof offsetQuerySchema>;

export const toOffset = ({ page, pageSize }: OffsetQuery) => ({ limit: pageSize, offset: (page - 1) * pageSize });

export const paginate = <T>(items: T[], total: number, { page, pageSize }: OffsetQuery) => ({
  items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

// ---- cursor (keyset on (createdAt desc, id desc)) ----
const cursorSchema = z.tuple([z.string().datetime(), z.string().uuid()]);
export type Cursor = { createdAt: Date; id: string };

export const encodeCursor = (c: Cursor) => Buffer.from(JSON.stringify([c.createdAt.toISOString(), c.id])).toString('base64url');
export const decodeCursor = (s: string): Cursor => {
  const [createdAt, id] = cursorSchema.parse(JSON.parse(Buffer.from(s, 'base64url').toString('utf8')));
  return { createdAt: new Date(createdAt), id };
};

export const cursorQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(512).optional().transform((s, ctx) => {
    if (!s) return undefined;
    try { return decodeCursor(s); } catch { ctx.addIssue({ code: 'custom', message: 'Invalid cursor' }); return z.NEVER; }
  }),
});
export type CursorQuery = z.infer<typeof cursorQuerySchema>;

export const cursorPage = <T extends { createdAt: Date; id: string }>(rows: T[], limit: number) => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return { items, hasMore, nextCursor: hasMore && last ? encodeCursor(last) : null };
};
```

```ts
// repository (Drizzle, Postgres)
export function listFilesPage(ownerId: string, parentId: string | null, { limit, cursor }: CursorQuery) {
  return db.select(fileCols).from(files)
    .where(and(
      eq(files.ownerId, ownerId),
      parentId ? eq(files.parentId, parentId) : isNull(files.parentId),
      isNull(files.trashedAt),
      cursor ? sql`(${files.createdAt}, ${files.id}) < (${cursor.createdAt}, ${cursor.id})` : undefined,
    ))
    .orderBy(desc(files.createdAt), desc(files.id))
    .limit(limit + 1);
}

// controller
const q = cursorQuerySchema.parse(req.query);
const rows = await filesRepo.listFilesPage(ownerId, parentId, q);
res.json(ok(cursorPage(rows, q.limit)));
```

On Workers, replace `Buffer` with `btoa`/`atob` + `encodeURIComponent` or a
small base64url helper.

Related: [03-databases/pagination.md](../../03-databases/pagination.md), [05-apis/pagination.md](../../05-apis/pagination.md)
