# Abstraction guidelines

## What is it?

An abstraction hides *how* something is done behind a name that says *what*
is done. Functions, modules, components, hooks, interfaces, and base classes
are all abstractions. The question is never "should I abstract" but "does this
abstraction pay for itself".

## Why does it matter?

The wrong abstraction is the most expensive mistake in a codebase: it looks
like reuse, so people keep extending it with flags and special cases, and
nobody dares delete it. Duplication is visible and cheap to fix later; a bad
abstraction is invisible and expensive.

## Useful vs. premature abstraction

| Useful abstraction | Premature abstraction |
| --- | --- |
| Extracted from three or more real, working usages | Designed up front for imagined usages |
| Callers change for the same reason | Callers change for different reasons; the abstraction grows flags |
| Has a name that describes a domain or technical concept | Has a name like `BaseX`, `GenericY`, `AbstractZ`, `XManager` |
| Reduces what a reader has to know | Adds a layer the reader must open to understand |
| Interface is smaller than the sum of its implementations | Interface mirrors one implementation exactly |
| Can be deleted by inlining into callers | Cannot be removed without rewriting callers |

## The test

Before extracting, answer all three:

1. **Do I have three concrete usages?** (Two is a coincidence.)
2. **Will they change together?** If a rule change in one must be a rule change in all, extract. If not, don't.
3. **Is the interface smaller than what it hides?** If the caller still passes everything through, nothing was abstracted.

## Examples

### Bad abstraction

```jsx
// A "universal" component that hides nothing and grows forever
<DataTable
  rows={rows}
  columns={columns}
  selectable
  onSelect={...}
  expandable
  renderExpanded={...}
  showSearch
  searchPlaceholder="..."
  showPagination
  pageSize={20}
  serverSide
  onPageChange={...}
  toolbarLeft={...}
  toolbarRight={...}
  emptyText="..."
  loading={isLoading}
  variant="compact"
  stickyHeader
/>
```

Every page needs a slightly different table, so every page adds a prop.
The component is now harder to understand than the tables it replaced.

### Good abstraction

```jsx
// Small primitives that compose; each page assembles what it needs
<Table>
  <TableToolbar>
    <SearchInput value={q} onChange={setQ} />
    <Button onClick={openCreate}>New user</Button>
  </TableToolbar>
  <TableBody rows={rows} columns={columns} />
  <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
</Table>
```

The shared parts (`Table`, `TablePagination`, `SearchInput`) have one job
each. Page-specific behaviour stays on the page. See
[10-frontend/components/composition.md](../10-frontend/components/composition.md).

### Over-engineered abstraction

```ts
// A repository interface with one implementation, a factory, and DI container
interface IUserRepository { /* 12 methods */ }
class PostgresUserRepository implements IUserRepository { /* ... */ }
class UserRepositoryFactory { static create(): IUserRepository { /* ... */ } }
container.register('IUserRepository', UserRepositoryFactory.create);
```

There is one database. Nothing is swapped. Tests can use a real test
database. A module exporting query functions does the same job with a fifth
of the code (see [04-drizzle-orm/repository-pattern.md](../04-drizzle-orm/repository-pattern.md)).

### Abstraction that earns its place

```ts
// One HTTP client: every API call shares auth, envelope parsing, and error mapping
export async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE_URL}${path}`, withAuth(init));
  return parseEnvelope<T>(res);
}
```

Dozens of callers, one reason to change (the API contract), a smaller
interface than what it hides.

## When to introduce an abstraction

```text
Is the same knowledge (rule, shape, protocol) in 3+ places?
  ├── No  → leave it
  └── Yes → Would a change in one require the same change in the others?
              ├── No  → leave it (similar-looking, different reasons)
              └── Yes → extract; give it a domain name; keep the surface small
```

## When to remove one

- It has grown boolean flags or a `mode` prop.
- Callers pass most of their inputs straight through.
- Nobody can explain what it does without listing its callers.
- It has one implementation and no test uses a fake.

Inline it. Duplication you can see is better than indirection you can't follow.

## Common mistakes

- Extracting on the second occurrence.
- Naming abstractions by their shape (`Wrapper`, `Base`) instead of their meaning.
- Configuration objects as a substitute for composition.
- Sharing code across features that only *look* alike (two "address" forms with different rules).

## Checklist

- [ ] Every shared unit has three or more callers, or exists for a proven testability need.
- [ ] No shared component or function has a `mode`/`variant` prop that changes what it fundamentally does (visual variants are fine; behavioural modes are not).
- [ ] Every abstraction can be described without listing its callers.
- [ ] The interface is smaller than what it hides.

## Related

- [dry-kiss-yagni.md](dry-kiss-yagni.md)
- [avoiding-code-redundancy.md](avoiding-code-redundancy.md)
- [10-frontend/components/when-not-to-reuse.md](../10-frontend/components/when-not-to-reuse.md)
- [23-decision-guides/code-organization.md](../23-decision-guides/code-organization.md)
