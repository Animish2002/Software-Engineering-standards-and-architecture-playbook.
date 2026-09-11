# Reusable styling patterns

## 1. Component with `cva` (the default)

```tsx
const cardVariants = cva('rounded-lg border bg-card text-card-foreground shadow-sm', {
  variants: {
    padding: { none: '', sm: 'p-3', md: 'p-4 md:p-6' },
    interactive: { true: 'transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring', false: '' },
  },
  defaultVariants: { padding: 'md', interactive: false },
});
export function Card({ className, padding, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ padding, interactive }), className)} {...props} />;
}
```

Use for every repeated visual unit. Variants are typed; overrides via
`className`.

## 2. Data-attribute styling for state

```tsx
<div data-state={selected ? 'selected' : 'idle'} className="data-[state=selected]:bg-accent" />
<button data-loading={isLoading} className="data-[loading=true]:opacity-60" />
```

Radix components already expose `data-state`; style against it rather
than duplicating state in classes. Keeps the class string static.

## 3. `group` and `peer`

```tsx
<div className="group">
  <button className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">…</button>
</div>
<input className="peer" /><p className="hidden peer-invalid:block">Invalid</p>
```

Named groups (`group/card`, `group-hover/card:`) when nested.

## 4. Base-layer CSS for global primitives

```css
@layer base {
  body { @apply bg-background text-foreground antialiased; }
  h1 { @apply scroll-m-20 text-3xl font-semibold tracking-tight; }
  ::selection { @apply bg-primary/20; }
}
```

Only for element defaults and resets. Not for `.btn-primary`.

## 5. `@apply` (rarely)

Acceptable for a handful of global classes that can't be components
(third-party markup you don't control, markdown output):

```css
@layer components {
  .prose-app { @apply max-w-none text-foreground; }
  .prose-app a { @apply text-primary underline-offset-4 hover:underline; }
}
```

Not acceptable as a way to name page-level styles (`.user-card { @apply … }`); that recreates a CSS codebase without its tooling. Make a component.

## 6. Tokens for repeated arbitrary values

`max-h-[16rem]` in three places → `--spacing-panel: 16rem` in `@theme` →
`max-h-panel`.

## 7. Slot-based styling for compound components

Parts style themselves; the parent passes nothing but `className`. Consumers
override per part, not through the root.

## Decision

```text
Is it a visual unit used in 3+ places?          → component + cva
Is it state-dependent styling on one element?   → data-attribute variants
Is it a value repeated in arbitrary brackets?   → token
Is it an element default or a reset?            → @layer base
Is it markup you don't own?                     → @layer components + @apply (minimal)
Otherwise                                       → inline utilities
```

## Related

- [avoiding-duplication.md](avoiding-duplication.md)
- [component-styling.md](component-styling.md)
- [../10-frontend/components/variants.md](../10-frontend/components/variants.md)
