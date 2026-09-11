# API testing (black-box over HTTP)

## Why this layer

It tests what the frontend and third parties actually depend on: the
HTTP contract, including auth, permissions, tenancy, validation, and the
envelope. It runs against the real app with the real database and is
independent of internal refactors.

## Setup

- The API started with `NODE_ENV=test` (rate limiting off; bot-protection test key; email capture).
- Playwright's `request` fixture (no browser is launched) or `supertest` against `createApp()`. The Playwright approach tests the real listening process, including router mounting order.

```ts
// tests/api/playwright.config.ts
export default defineConfig({ testDir: '.', use: { baseURL: process.env.API_URL ?? 'http://localhost:4000' }, workers: 1 });
```

```ts
// tests/api/helpers.ts
export async function login(request: APIRequestContext, email: string, password = 'password') {
  const res = await request.post('/auth/login', { data: { email, password, turnstileToken: 'test' } });
  const body = await res.json();
  expect(body.success).toBe(true);
  return { token: body.data.accessToken as string, cookies: res.headers()['set-cookie'] };
}
export const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
```

## The spec per endpoint

```ts
test.describe('POST /folders', () => {
  test('creates a folder for the caller', async ({ request }) => {
    const { token } = await login(request, employee.email);
    const res = await request.post('/folders', { ...auth(token), data: { name: 'Reports', parentId: null } });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ success: true, data: { name: 'Reports', parentId: null } });
    expect(body.data.id).toMatch(UUID_RE);
  });
  test('400 on invalid body with field details', async ({ request }) => {
    const { token } = await login(request, employee.email);
    const res = await request.post('/folders', { ...auth(token), data: { name: '' } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatchObject({ code: 'VALIDATION_FAILED', details: { name: expect.any(Array) } });
  });
  test('401 without a token', async ({ request }) => {
    expect((await request.post('/folders', { data: { name: 'x', parentId: null } })).status()).toBe(401);
  });
  test('403 without folder:create', async ({ request }) => { /* a role lacking the key */ });
  test('404 when parent belongs to another user', async ({ request }) => {
    const a = await login(request, userA.email); const b = await login(request, userB.email);
    const folder = await (await request.post('/folders', { ...auth(a.token), data: { name: 'A', parentId: null } })).json();
    const res = await request.post('/folders', { ...auth(b.token), data: { name: 'B', parentId: folder.data.id } });
    expect(res.status()).toBe(404);
  });
});
```

## Suites worth separating

| Suite | Contents |
| --- | --- |
| `security` | 401/403/404 tenancy for every mutating endpoint; public share token scoping (can't escape the shared subtree); deactivated account can't refresh; refresh token reuse detection |
| `contracts` | Happy paths + validation + envelope for every endpoint |
| `auth-flows` | login → refresh → logout; forgot/reset password with captured email |
| `latency` | p95 of the top endpoints under a small load against a seeded DB; fails if a threshold regresses (catches a missing index) |

## Rules

- Tests create their own users/data via the API or factories; never depend on demo seed accounts except a bootstrapped super-admin.
- Assert on status + `code`, not on message text.
- Never run against production.
- `workers: 1` unless data isolation per worker is guaranteed.

## Related

- [testing-strategy.md](testing-strategy.md)
- [15-security/authorization.md](../15-security/authorization.md)
- [17-performance/profiling.md](../17-performance/profiling.md)
