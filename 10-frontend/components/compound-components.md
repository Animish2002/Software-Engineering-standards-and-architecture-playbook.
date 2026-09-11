# Compound components

## What is it?

A set of components that work together through a shared context, exposed
as a family (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`). The
consumer composes them; the family coordinates state internally.

## When to build one

- A widget has several optional regions that must coordinate (a table with toolbar/header/body/pagination; a stepper; a file dropzone with a preview list).
- You're about to add `showX`/`renderX` props for each region.

## Shape

```tsx
// components/common/data-list.tsx
type Ctx = { selected: Set<string>; toggle: (id: string) => void; clear: () => void };
const DataListContext = createContext<Ctx | null>(null);
const useDataList = () => { const c = useContext(DataListContext); if (!c) throw new Error('DataList.* must be inside <DataList>'); return c; };

export function DataList({ children, className }: { children: React.ReactNode; className?: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const value = useMemo(() => ({ selected, toggle, clear }), [selected, toggle, clear]);
  return <DataListContext.Provider value={value}><div className={cn('flex flex-col gap-3', className)}>{children}</div></DataListContext.Provider>;
}

export function DataListBulkBar({ children }: { children: (n: number, clear: () => void) => React.ReactNode }) {
  const { selected, clear } = useDataList();
  if (selected.size === 0) return null;
  return <div className="flex items-center gap-2 rounded-md border bg-muted p-2">{children(selected.size, clear)}</div>;
}

export function DataListRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { selected, toggle } = useDataList();
  return <div data-selected={selected.has(id)} className="flex items-center gap-3 data-[selected=true]:bg-accent"><Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} />{children}</div>;
}

DataList.BulkBar = DataListBulkBar;
DataList.Row = DataListRow;
```

```tsx
<DataList>
  <DataList.BulkBar>{(n, clear) => <><span>{n} selected</span><Button onClick={() => trashMany()}>Trash</Button><Button variant="ghost" onClick={clear}>Clear</Button></>}</DataList.BulkBar>
  {items.map((i) => <DataList.Row key={i.id} id={i.id}><FileRow item={i} /></DataList.Row>)}
</DataList>
```

## Rules

- Context value memoised; throw a clear error when a child is used outside the parent.
- Parts are small and single-purpose; the parent holds coordination state only.
- Export parts as named exports **and** as static properties for discoverability (`DataList.Row`); pick one style per project.
- Don't pass data through context that only one part needs; pass it as a prop to that part.
- Keep it a compound only while parts genuinely share state. If they don't, they're just siblings.

## shadcn examples to copy the style from

`Dialog`, `DropdownMenu`, `Select`, `Tabs`, `Command`, `Form`: each is a
family of thin parts around a Radix root. Build app-level families the
same way.

## Related

- [composition.md](composition.md)
- [../../12-shadcn/composition.md](../../12-shadcn/composition.md)
