# Separation of concerns

## What is it?

Keeping code that changes for different reasons in different places, with
narrow, explicit interfaces between them. The concerns that recur in every
application:

| Concern | Changes when... | Lives in |
| --- | --- | --- |
| Transport (HTTP parsing, status codes) | The API contract changes | Controllers / route handlers |
| Business rules | The product changes | Services / domain modules |
| Persistence | The schema or database changes | Repositories / query modules |
| Presentation | The UI changes | Components |
| Cross-cutting (auth, logging, rate limiting) | Policy changes | Middleware |
| Configuration | The environment changes | Config module |

## Why does it matter?

When concerns are mixed, one change forces you to touch and re-test
everything. A controller that builds SQL cannot be reused by a background job.
A React component that calls `fetch` cannot be rendered in a test without a
server.

## Recommended approach

**Backend request flow** (details in [02-backend/layers.md](../02-backend/layers.md)):

```text
route  →  middleware  →  controller  →  service  →  repository  →  database
              ↑              ↑             ↑             ↑
           auth,          parse &       business      SQL / ORM
           logging        validate        rules          only
```

- Controllers never contain business rules or queries.
- Services never read `req`/`res` and never build HTTP responses.
- Repositories never make decisions; they read and write.
- Nothing below the controller knows about HTTP.

**Frontend** (details in [10-frontend/architecture.md](../10-frontend/architecture.md)):

```text
page  →  feature components  →  hooks  →  api layer  →  http client
                                 ↑
                          state & effects
```

- Components render; they do not call `fetch`.
- Hooks own state and effects.
- The API layer owns request shaping and the response envelope.

## Example

```js
// Recommended: each layer has one job
// users.controller.js
export const createUser = asyncHandler(async (req, res) => {
  const input = createUserSchema.parse(req.body);
  const user = await usersService.create(input, { actor: req.user });
  res.status(201).json(ok(user));
});

// users.service.js
export async function create(input, { actor }) {
  if (!actor.permissions.includes('user:manage')) throw new ForbiddenError();
  const existing = await usersRepo.findByEmail(input.email);
  if (existing) throw new ConflictError('Email already registered');
  const passwordHash = await hashPassword(input.password);
  return usersRepo.insert({ ...input, passwordHash });
}

// users.repository.js
export const findByEmail = (email) =>
  db.query.users.findFirst({ where: eq(users.email, email) });
```

## Bad example

```js
// Avoid: transport, rules, persistence and side effects in one place
app.post('/users', async (req, res) => {
  if (!req.headers.authorization) return res.status(401).send('no');
  const rows = await db.execute(sql`select * from users where email = ${req.body.email}`);
  if (rows.length) return res.status(400).send('exists');
  const hash = await bcrypt.hash(req.body.password, 10);
  await db.execute(sql`insert into users ...`);
  await fetch('https://mail.example.com/send', { /* ... */ });
  res.send('ok');
});
```

Nothing here can be reused, tested in isolation, or changed without risk.

## When should I NOT separate?

- A ten-line script. Layers for a cron job that copies a file are noise.
- A prototype you will throw away (and actually throw away).
- When the "separation" is a pass-through: a repository method that only calls
  one ORM method and is used once adds a hop without a benefit. Inline it until
  a second caller or a test needs it.

## Common mistakes

- Services that accept `req` "for convenience". Now the service is HTTP-only.
- Controllers that catch errors and decide status codes per handler. Centralise that in one error middleware (see [error-handling.md](error-handling.md)).
- Components that reach into `localStorage`, `window.location`, or `fetch` directly.
- Splitting by *technical type* across the whole app (`controllers/`, `services/`, `models/` at the top level) instead of by feature. Fine for small apps; painful past ~10 modules. See [01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md).

## Checklist

- [ ] No `req`/`res` below the controller layer.
- [ ] No SQL or ORM calls in controllers or components.
- [ ] No business rules in repositories or middleware.
- [ ] One error middleware maps errors to responses.
- [ ] Cross-cutting concerns are middleware, applied once.

## Related

- [single-responsibility.md](single-responsibility.md)
- [01-project-architecture/layered-architecture.md](../01-project-architecture/layered-architecture.md)
- [02-backend/layers.md](../02-backend/layers.md)
