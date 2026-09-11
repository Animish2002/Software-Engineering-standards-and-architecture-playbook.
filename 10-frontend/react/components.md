# Writing components

## File shape

```tsx
// features/items/components/DriveItemCard.tsx
import { type ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import type { DriveItem } from '@app/shared-types';

type DriveItemCardProps = {
  item: DriveItem;
  previewUrl?: string;
  selected?: boolean;
  onOpen: (item: DriveItem) => void;
  onMenu: (item: DriveItem, anchor: HTMLElement) => void;
} & Omit<ComponentProps<'div'>, 'onClick'>;

export function DriveItemCard({ item, previewUrl, selected = false, onOpen, onMenu, className, ...rest }: DriveItemCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={item.name}
      className={cn('group rounded-lg border bg-card p-3 transition-colors hover:bg-accent', selected && 'ring-2 ring-primary', className)}
      onDoubleClick={() => onOpen(item)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
      {...rest}
    >
      <CardHeader item={item} onMenu={onMenu} />
      <Preview item={item} url={previewUrl} />
      <CardFooter item={item} />
    </div>
  );
}

function CardHeader(/* ... */) { /* local, not exported */ }
```

- One exported component per file, named the same as the file.
- Props type declared above the component; extend native props with `ComponentProps<'el'>` and forward `className` + `...rest`.
- Local sub-components below, unexported, when they exist only to keep the main one readable.
- Defaults via destructuring.
- Event handler props `onX`; internal handlers `handleX`.

## Props design

- Few, specific props. If a component needs more than ~8, it's probably two components or should take `children`.
- Data in, events out. No callbacks that return data the component then stores.
- Booleans for on/off; unions for variants (`size: 'sm' | 'md'`), never several booleans that can conflict.
- Pass **ids or objects consistently**. Don't pass `item` to one component and `itemId` + `name` + `size` to its sibling.
- Never pass the whole `user`/`store` to a leaf that needs one field.

## `children` and composition

```tsx
<PageHeader title="Users" actions={<Button>New</Button>} />          // named slot for one thing
<Card><CardHeader>…</CardHeader><CardContent>…</CardContent></Card>    // children for structure
```

Slots (`actions`, `footer`) for a single optional region; `children` for
free-form structure. See [patterns.md](patterns.md) and
[../components/composition.md](../components/composition.md).

## Container vs presentational

A feature component may fetch via a hook *and* render when the screen is
small. Split when either the fetching hook or the presentational part is
reused, or when the file passes ~150 lines.

```tsx
// container
export function UsersTableContainer() { const q = useUsers(params); /* loading/error/empty */ return <UsersTable rows={q.data.items} onEdit={…} />; }
// presentational
export function UsersTable({ rows, onEdit }: Props) { /* pure */ }
```

## Don't

- Default-export components (harder to refactor/grep); except when a lazy route import requires it, and then re-export as default from a named export.
- Define components inside other components (new identity every render → remount, lost state).
- Spread unknown props onto DOM elements without filtering (`{...item}` onto a `div` leaks invalid attributes).
- Read `window`/`document` during render (SSR/tests); do it in effects or event handlers.

## Related

- [hooks.md](hooks.md)
- [../components/README.md](../components/README.md)
