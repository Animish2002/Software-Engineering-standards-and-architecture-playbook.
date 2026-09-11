# Shared Zod primitives

```ts
// packages/validation/src/primitives.ts
import { z } from 'zod';

export const id = z.string().uuid();
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(128);
export const name = z.string().trim().min(1).max(120);
export const fileName = z.string().trim().min(1).max(255).refine((s) => !/[\/\\\x00-\x1f]/.test(s), 'Invalid characters in name');
export const nullableId = id.nullable();
export const isoDate = z.string().datetime();
export const bytes = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const idList = (max = 200) => z.array(id).min(1).max(max);

export const idParamSchema = z.object({ id });
export const offsetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export const sortSchema = <T extends [string, ...string[]]>(fields: T, def: T[number]) => z.object({
  sort: z.enum(fields).default(def),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

```ts
// packages/validation/src/user.ts
export const createUserSchema = z.object({ email, name, password, roleId: id, storageQuotaBytes: bytes.optional() });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateProfileSchema = z.object({
  name: name.optional(),
  password: password.optional(),
  currentPassword: z.string().optional(),
}).refine((v) => !v.password || !!v.currentPassword, { message: 'Current password is required to change password', path: ['currentPassword'] });
```

Both the API controller and the react-hook-form resolver import these.

Related: [02-backend/validation.md](../../02-backend/validation.md), [10-frontend/forms-and-validation.md](../../10-frontend/forms-and-validation.md)
