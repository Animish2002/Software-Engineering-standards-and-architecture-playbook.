# Validation in Hono

```bash
npm i @hono/zod-validator zod
```

```ts
import { zValidator } from '@hono/zod-validator';

app.post('/users',
  zValidator('json', createUserSchema),
  zValidator('query', z.object({ notify: z.coerce.boolean().default(false) })),
  async (c) => {
    const input = c.req.valid('json');      // typed as CreateUserInput
    const { notify } = c.req.valid('query');
    // ...
  });
```

Targets: `'json'`, `'form'`, `'query'`, `'param'`, `'header'`, `'cookie'`.

## Uniform validation errors

By default `zValidator` returns its own 400 body. Override once with a hook
so every validation failure uses the envelope:

```ts
// lib/validate.ts
import { zValidator as base } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { fail } from './response';

export const zValidator = <T extends ZodSchema, Target extends 'json' | 'query' | 'param' | 'header' | 'form'>(target: Target, schema: T) =>
  base(target, schema, (result, c) => {
    if (!result.success) return c.json(fail('Validation failed', 'VALIDATION_FAILED', result.error.flatten().fieldErrors), 400);
  });
```

Import this wrapper everywhere instead of the library's directly.

## Shared schemas

Same `packages/validation` schemas as the Express and frontend code.
Workers bundle them fine (Zod has no Node dependencies).

## OpenAPI

`@hono/zod-openapi` replaces `zValidator` with `createRoute` + `app.openapi(...)`
and serves `/openapi.json`. Use it when the API has external consumers;
otherwise `zValidator` is lighter. See [05-apis/documentation.md](../05-apis/documentation.md).

## Related

- [02-backend/validation.md](../02-backend/validation.md)
- [error-handling.md](error-handling.md)
