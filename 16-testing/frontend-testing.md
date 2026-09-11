# Frontend testing

## Setup

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

```ts
// vitest.config.ts
export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true } });
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { server } from './msw';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```ts
// src/test/msw.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
export const ok = <T>(data: T) => HttpResponse.json({ success: true, data });
export const fail = (message: string, code: string, status = 400) => HttpResponse.json({ success: false, error: { message, code } }, { status });
export const server = setupServer(
  http.get('*/items/view', () => ok({ items: [], breadcrumbs: [], folderSizes: {}, starredIds: [], previewUrls: {} })),
);
```

## What to test

| Target | Test | Skip |
| --- | --- | --- |
| `lib/` pure functions | Formatters, `hasPermission`, cursor helpers, folder-drop readers | |
| `lib/http.ts` | Envelope parsing, refresh-on-401 single-flight, network error → `ok:false` | |
| Feature hooks | `renderHook(useDriveView)`: loading → data; error; `markStale` triggers revalidate without `isLoading` | |
| Shared components | `ConfirmDialog` pending state + `onConfirm`; `Pagination` clamps; `EmptyState` action; form fields show server errors | Styling, snapshots |
| Feature components | `ShareDialog` submits selected recipients; reports per-recipient failures | Every visual state |
| Pages | One smoke test per page: renders with MSW data, no console errors | Full flows |
| Routing guards | `RequirePermission` renders forbidden state without the key | |

## Example

```tsx
it('shows server field errors from VALIDATION_FAILED', async () => {
  server.use(http.post('*/users', () => fail('Validation failed', 'VALIDATION_FAILED', 400)));   // with details in a real handler
  render(<CreateUserForm onCreated={vi.fn()} />, { wrapper: Providers });
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.click(screen.getByRole('button', { name: /create/i }));
  expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
});
```

## Rules

- Query by role/label/text (what users see), not by test ids, except for non-semantic containers.
- `userEvent`, not `fireEvent`.
- Wrap in the real providers (`Providers` test wrapper with a fresh cache/query client per test).
- `onUnhandledRequest: 'error'` so a missing mock fails loudly.
- No dev server, no browser automation in the unit suite.

## Optional: E2E

A few Playwright browser tests against a preview deployment for the
critical flows. Keep them independent, data-creating, and few. Don't use
them as the primary safety net.

## Related

- [10-frontend/testing.md](../10-frontend/testing.md)
- [testing-strategy.md](testing-strategy.md)
