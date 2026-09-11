# Styling shared components

## Contract for every shared component

1. **Owns its base classes** (via `cva` or a constant).
2. **Accepts `className`** and merges it **last** with `cn`, so consumers can override without new props.
3. **Exposes visual variants as props** (`variant`, `size`), never raw style props (`color="red"`, `padding={16}`).
4. **Uses semantic tokens only** (`bg-card`, `text-muted-foreground`).
5. **Handles its own states**: hover, focus-visible, disabled, `data-state`, `aria-invalid`.
6. **Doesn't set outer layout** (margins, width, grid placement). The consumer positions it; the component sizes its own interior.

```tsx
// Recommended
export function StatCard({ label, value, hint, icon: Icon, className, ...props }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-1', className)} {...props}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>{Icon && <Icon className="size-4" aria-hidden />}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
```

```tsx
// Consumer positions it
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard label="Used" value={formatBytes(used)} />
  <StatCard label="Files" value={count} className="lg:col-span-2" />
</div>
```

## Avoid

```tsx
// margin baked in: every consumer fights it
<Card className="mb-4 w-64">…</Card>
// style props: unbounded surface, no tokens
<Card color="#eee" padding={12} rounded />
// consumer restyling internals with descendant selectors
<Card className="[&_h3]:text-red-500">…</Card>   // means Card needs a variant or a slot
```

## Overriding internals

If consumers regularly need to restyle an inner part, expose it:
`classNames={{ header: '…', body: '…' }}` for small components, or make
it a compound component so each part takes its own `className`.

## shadcn `ui/` components

Treat generated files as **owned code, minimally edited**: adjust tokens,
add a variant to the `cva` block, keep the structure. Wholesale rewrites
make future `npx shadcn add` diffs painful. App-level composition goes in
`components/common/`, not by editing `ui/button.tsx` per page's needs.

## Related

- [reusable-patterns.md](reusable-patterns.md)
- [../12-shadcn/customization.md](../12-shadcn/customization.md)
