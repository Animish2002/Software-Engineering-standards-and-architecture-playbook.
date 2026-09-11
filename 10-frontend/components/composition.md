# Composition over configuration

## The problem with configuration

```jsx
// Avoid: every new page adds a prop
<DataTable
  rows={rows} columns={columns}
  showSearch searchPlaceholder="Search users…" onSearch={setQ}
  showCreate createLabel="New user" onCreate={openCreate}
  showPagination page={page} pageCount={pageCount} onPageChange={setPage}
  emptyTitle="No users" emptyDescription="Create the first one" emptyAction={…}
  rowActions={(row) => [{ label: 'Edit', onClick: … }, { label: 'Delete', onClick: …, destructive: true }]}
  selectable onSelectionChange={setSelected}
  loading={isLoading} error={error} onRetry={refetch}
/>
```

The component knows about every page's needs and none of them well.
Adding a feature to one page means editing the shared component and
re-testing every page that uses it.

## The composed version

```jsx
// Recommended: small parts, assembled here
<PageHeader title="Users" actions={<Button onClick={openCreate}>New user</Button>} />
<Toolbar><SearchInput value={q} onChange={setQ} placeholder="Search users…" /></Toolbar>

<QueryState query={usersQuery} skeleton={<LoadingState variant="table" />} empty={<EmptyState title="No users" action={…} />}>
  {({ items }) => (
    <Table>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>
        {items.map((u) => (
          <TableRow key={u.id}>
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell className="text-right"><RowMenu items={[{ label: 'Edit', onSelect: () => edit(u) }, { label: 'Deactivate', onSelect: () => trash(u), destructive: true }]} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
</QueryState>

<Pagination page={page} pageCount={pageCount} onChange={setPage} />
```

Each shared part (`PageHeader`, `Toolbar`, `SearchInput`, `QueryState`,
`Table*`, `RowMenu`, `Pagination`, `LoadingState`, `EmptyState`) has one
job and a small prop surface. The page is longer, but it is *this page's*
code, and changing it affects nothing else.

## When a page-level assembly repeats

If three pages assemble the same list-with-toolbar in exactly the same way
and they should change together, extract **that assembly** as a feature-
neutral component (`ResourceListPage`) built from the same primitives,
keeping the primitives available for the pages that differ. The extracted
component is still thin: it composes; it does not configure.

## Techniques

| Technique | Use |
| --- | --- |
| `children` | Free-form structure inside a container (`Card`, `Dialog`) |
| Named slots (`actions`, `footer`) | One optional region |
| Compound components | Parts that coordinate (`Tabs`, `DropdownMenu`, `Table`) |
| Render function (`QueryState` above) | The wrapper owns state; the consumer owns markup |
| Hooks for logic | `useUsers()`, `useSelection()`; the page decides how to render |
| `asChild` (Radix) | Merge behaviour into the consumer's element (`<Button asChild><Link/></Button>`) |

## Sizing a shared component

- Props ≤ 8, each with an obvious meaning.
- No prop whose value is a config object describing UI (`columns={[{ key, label, render, width, sortable, … }]}` is acceptable for a table; `toolbar={{ search: {...}, actions: [...] }}` is not).
- Can be explained in one sentence without listing callers.

## Related

- [compound-components.md](compound-components.md)
- [catalog.md](catalog.md)
- [when-not-to-reuse.md](when-not-to-reuse.md)
