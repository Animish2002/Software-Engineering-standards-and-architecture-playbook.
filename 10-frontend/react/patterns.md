# React patterns

## Controlled vs uncontrolled

| | Controlled | Uncontrolled |
| --- | --- | --- |
| Value lives in | Parent state (`value` + `onChange`) | The component/DOM (`defaultValue`, read via ref or on submit) |
| Use for | Values other UI depends on live (search that filters as you type; a dialog whose `open` the page decides) | Forms managed by react-hook-form; simple inputs read on submit |
| Cost | Re-render per change | None |

Shared components support **both**: accept `value`/`onValueChange` and
`defaultValue`, resolving with a small `useControllableState` helper
(Radix does this internally). Never switch a given input between the two
modes at runtime.

## Compound components

Related parts that share implicit state through context, composed by the
consumer:

```tsx
<Table>
  <TableToolbar><SearchInput /><Button>New</Button></TableToolbar>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
  <TablePagination />
</Table>
```

Use when a widget has several optional regions that must coordinate
(tabs, accordions, dropdown menus, data tables). Beats a single component
with `showToolbar`, `showPagination`, `toolbarLeft`, `toolbarRight` props.
shadcn components are built this way; copy the approach for your own.

## Slots (named children)

For one optional region: `actions={<Button/>}`, `footer={…}`. For several
regions with ordering, prefer compound components.

## Render props / function children

```tsx
<VirtualList items={rows} renderItem={(row) => <Row row={row} />} />
<Dropzone>{({ isDragging }) => <Zone active={isDragging} />}</Dropzone>
```

Use when the parent controls iteration or state and the consumer controls
the markup. Prefer hooks (`useDropzone()`) when no markup is owned by the
provider.

## Custom hooks as the reuse mechanism for logic

Reuse **behaviour** with hooks, **markup** with components. A "container
component" that only fetches and passes data down is usually better as a
hook.

## Portals

Dialogs, popovers, and toasts render into `document.body` (Radix does it)
so they escape `overflow: hidden` and stacking contexts. Don't hand-roll
z-index wars; use the primitives.

## Error boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';
<ErrorBoundary FallbackComponent={ErrorState} onReset={refetch} resetKeys={[folderId]}>…</ErrorBoundary>
```

Per route and around risky widgets (PDF renderer). Not for API errors.

## Higher-order components

Rarely needed now; hooks and wrapper components cover it. `RequirePermission`
as a wrapper *component* (renders `<Outlet/>` or children) is clearer than a
HOC.

## Lifting state vs context vs store

Lift to the nearest common parent first. Context when a subtree needs it
and it changes rarely. Store when it changes often or from outside React.
See [../state-management.md](../state-management.md).

## Related

- [../components/composition.md](../components/composition.md)
- [../components/compound-components.md](../components/compound-components.md)
