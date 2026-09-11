# Async handler (Express 4 only)

Express 5 forwards rejected promises to error middleware. On Express 4,
wrap every async handler:

```ts
// lib/async-handler.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler => (req, res, next) => {
  fn(req, res, next).catch(next);
};
```

```ts
router.get('/', asyncHandler(async (req, res) => { res.json(ok(await list())); }));
```

Keep the file even on Express 5 if you want a single place to add
per-handler instrumentation later; otherwise delete it.
