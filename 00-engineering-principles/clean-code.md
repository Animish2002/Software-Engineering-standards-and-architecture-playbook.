# Clean code

## What is it?

Code that a competent colleague can read, understand, change, and verify
without asking you questions. Not "short", not "clever": *obvious*.

## Why does it matter?

Most of a project's cost is maintenance. Every unclear function is a tax paid
on every future read. Clean code is the cheapest form of documentation.

## Recommended approach

### Functions

- Do one thing, named by a verb: `calculateInvoiceTotal`, `sendWelcomeEmail`.
- Keep them short enough to read without scrolling; around 20-40 lines is a
  healthy ceiling, but the real test is "can I name what it does in one phrase".
- Take few parameters. Three or more distinct values usually want an options object.
- Return early for guard conditions instead of nesting.
- No hidden side effects. A function called `getUser` must not also update `lastSeenAt`.

```js
// Recommended
export async function activateUser(userId, { activatedBy }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User', userId);
  if (user.status === 'active') return user;

  const updated = await userRepository.update(userId, {
    status: 'active',
    activatedAt: new Date(),
    activatedBy,
  });
  await audit.log('user.activated', { userId, activatedBy });
  return updated;
}
```

```js
// Avoid: nesting, boolean flags, mixed responsibilities
export async function handleUser(id, flag, by) {
  const u = await db.query('select * from users where id = $1', [id]);
  if (u.rows.length) {
    if (flag) {
      if (u.rows[0].status !== 'active') {
        await db.query('update users set status = $1 where id = $2', ['active', id]);
        console.log('activated ' + id);
        // ... 40 more lines
      }
    }
  }
}
```

### Comments

- Explain **why**, not what. The code already says what.
- A comment that restates the next line is noise. Delete it.
- A comment that explains a non-obvious constraint ("R2 rejects presigned URLs
  longer than 7 days") is gold. Keep it next to the constraint.
- Commented-out code goes in Git history, not in the file.

### Structure

- Group by feature, not by type, once a project has more than a handful of files (see [01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md)).
- Keep files small enough that a name describes their whole content.
- Order file contents top-down: exports and main logic first, helpers below.

### Values and types

- Prefer `const`. Reassignment is a signal to look twice.
- Prefer immutable updates for shared data (see [22-javascript/immutability-and-functional.md](../22-javascript/immutability-and-functional.md)).
- Name magic numbers and strings: `const MAX_UPLOAD_BYTES = 50 * 1024 * 1024`.
- In TypeScript, model states as unions rather than booleans that can contradict each other:

```ts
// Avoid
type Upload = { isLoading: boolean; isError: boolean; data?: File };
// Recommended
type Upload =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'done'; data: File };
```

## Common mistakes

- Optimising for fewer lines instead of fewer surprises.
- Boolean parameters (`save(user, true)`) that require reading the callee to understand the call site.
- "Utils" files that become a dumping ground. Name modules by what they do.
- Abbreviations that only make sense to the author (`usrSvc`, `tmpArr`).
- Deep nesting instead of early returns.

## Checklist

- [ ] Every function has a single, nameable purpose.
- [ ] No function needs a comment to explain what it does.
- [ ] No boolean flag parameters.
- [ ] No magic numbers or strings.
- [ ] Guard clauses instead of nesting.
- [ ] Impossible states are unrepresentable (unions over booleans).

## Related

- [single-responsibility.md](single-responsibility.md)
- [naming-conventions.md](naming-conventions.md)
- [22-javascript/anti-patterns.md](../22-javascript/anti-patterns.md)
