# Unit testing (Vitest)

## Setup

```bash
npm i -D vitest
```

```ts
// vitest.config.ts (per app)
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'], clearMocks: true } });
```

Frontend: `environment: 'jsdom'`, plus a `setupFiles` for Testing Library
matchers.

## What makes a good unit test

- Tests behaviour through the public function, not internals.
- Named as a sentence: `it('rejects a move into the folder's own descendant')`.
- Arrange/act/assert, no branching, no loops over cases unless using `it.each`.
- Fast (ms), deterministic, no network, no real DB, no real time.

## Examples

```ts
// validation schema
describe('createUserSchema', () => {
  it('lowercases and trims email', () => {
    expect(createUserSchema.parse({ email: '  A@B.com ', name: 'A', password: 'x'.repeat(12), roleId: uuid }).email).toBe('a@b.com');
  });
  it.each([['short', 'x'], ['empty name', ''], ])('rejects %s', (_label, bad) => {
    expect(() => createUserSchema.parse({ email: 'a@b.com', name: bad, password: bad, roleId: uuid })).toThrow();
  });
});
```

```ts
// service rule with the repository mocked
vi.mock('./items.repository');
import * as repo from './items.repository';

it('refuses to move a folder into its own descendant', async () => {
  vi.mocked(resolveAccess).mockResolvedValue({ ownerId: 'u1', canEdit: true });
  vi.mocked(repo.isDescendant).mockResolvedValue(true);
  await expect(moveItem('u1', 'folderA', 'folderA-child')).rejects.toBeInstanceOf(ConflictError);
  expect(repo.setParent).not.toHaveBeenCalled();
});
```

```ts
// pure helper
it('encodes and decodes a keyset cursor', () => {
  const c = encodeCursor({ createdAt: new Date('2026-01-01T00:00:00Z'), id: 'abc' });
  expect(decodeCursor(c)).toEqual({ createdAt: '2026-01-01T00:00:00.000Z', id: 'abc' });
});
```

```ts
// time-dependent
it('expires reset tokens after one hour', () => {
  vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
  const t = issueResetToken();
  vi.setSystemTime(new Date('2026-01-01T01:00:01Z'));
  expect(isExpired(t)).toBe(true);
  vi.useRealTimers();
});
```

## Don't

- Mock the module under test.
- Assert on log output or private state.
- Write a unit test that needs a database "just this once"; that's an integration test.
- Snapshot large objects; assert the fields that matter.

## Related

- [testing-strategy.md](testing-strategy.md)
- [integration-testing.md](integration-testing.md)
