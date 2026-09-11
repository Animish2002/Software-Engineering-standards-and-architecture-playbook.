# Example: a paginated table with a confirm-delete flow

Assembles a real screen entirely from the shared catalog in
[10-frontend/components/catalog.md](../../10-frontend/components/catalog.md)
and the cache contract in
[10-frontend/state-management.md](../../10-frontend/state-management.md) —
showing composition in practice, not just described.

## The feature hook

```ts
// features/users/hooks/use-users.ts
export function useUsers(params: { page: number; q?: string }) {
  return useApiQuery(['users', params], () => usersApi.list(params));   // 19-reusable-patterns/frontend/use-api-query.md
}
export function useTrashUser() {
  return useApiMutation(usersApi.trash, { staleKeys: [['users']] });     // marks the list stale, not invalidated — no skeleton flash
}
```

## The page — pure composition, no restyled primitives

```tsx
// pages/users/UsersPage.tsx
export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const usersQuery = useUsers({ page, q });
  const trash = useTrashUser();
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);

  return (
    <>
      <PageHeader title="Users" actions={<Button asChild><Link to="/users/new">New user</Link></Button>} />
      <Toolbar><SearchInput value={q} onValueChange={(v) => { setQ(v); setPage(1); }} placeholder="Search users…" /></Toolbar>

      {usersQuery.isLoading && <LoadingState variant="table" />}
      {usersQuery.error && !usersQuery.data && <ErrorState description={usersQuery.error.message} onRetry={usersQuery.refetch} />}
      {usersQuery.data?.items.length === 0 && <EmptyState title="No users found" />}

      {usersQuery.data && usersQuery.data.items.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {usersQuery.data.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="text-right">
                  <RowMenu items={[
                    { label: 'Edit', onSelect: () => navigate(`/users/${u.id}`) },
                    { label: 'Deactivate', destructive: true, onSelect: () => setConfirmTarget(u) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {usersQuery.data && <Pagination page={page} pageCount={usersQuery.data.totalPages} onChange={setPage} />}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title={`Deactivate ${confirmTarget?.name}?`}
        description="They will lose access immediately. This can be undone by restoring the account."
        confirmLabel="Deactivate"
        destructive
        onConfirm={async () => {
          const res = await trash.mutateAsync(confirmTarget!.id);
          if (!res.ok) { toast.error(res.error.message); throw new Error(res.error.message); }
          toast.success(`${confirmTarget!.name} deactivated`);
        }}
      />
    </>
  );
}
```

## What this demonstrates

- **Nothing here is a new component.** Every piece — `PageHeader`,
  `Toolbar`, `SearchInput`, `LoadingState`/`ErrorState`/`EmptyState`,
  `Table*`, `RowMenu`, `Pagination`, `ConfirmDialog` — already exists in
  `components/common` and `components/ui`, per
  [10-frontend/components/composition.md](../../10-frontend/components/composition.md).
  A second page (Orders, Files) assembles the *same* pieces differently
  rather than copying this page's markup.
- **The loading contract is followed exactly**: `isLoading` (no data yet)
  shows a skeleton; a background revalidation after `setQ`/`setPage` does
  **not** re-show the skeleton because `markStale` keeps the previous data
  visible while refetching (see
  [10-frontend/error-and-loading-states.md](../../10-frontend/error-and-loading-states.md)).
- **The destructive action always confirms**, never a native `confirm()`,
  and the dialog stays open (by re-throwing) if the mutation fails.
- **No `fetch` appears anywhere in this file** — every server interaction
  goes through `usersApi` via the hooks.

## Related

- [10-frontend/components/catalog.md](../../10-frontend/components/catalog.md)
- [10-frontend/api-integration.md](../../10-frontend/api-integration.md)
- [19-reusable-patterns/frontend/confirm-dialog.md](../../19-reusable-patterns/frontend/confirm-dialog.md)
