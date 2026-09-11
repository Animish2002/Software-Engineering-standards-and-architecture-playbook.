# Tailwind organization

## Files

```text
src/styles/globals.css     @import tailwindcss; @theme tokens; shadcn variables; base layer
src/lib/cn.ts              clsx + tailwind-merge
components/ui/*            shadcn components (own their classes via cva)
```

No per-component CSS files. No CSS modules. The only stylesheet is
`globals.css`; everything else is utilities in JSX.

```ts
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

`cn` merges conditionally and resolves conflicts (`p-2` + `p-4` → `p-4`)
so consumers can override via `className`.

## Class ordering

Use the official Prettier plugin so nobody argues about it:

```bash
npm i -D prettier prettier-plugin-tailwindcss
```

```json
{ "plugins": ["prettier-plugin-tailwindcss"], "tailwindFunctions": ["cn", "cva"] }
```

Order becomes: layout → box → spacing → sizing → typography → visual → state/responsive. Enforced on save.

## Reading a long class string

Break at responsibility boundaries when a string passes ~10 utilities:

```tsx
<div
  className={cn(
    'flex items-center gap-2 rounded-md border px-3 py-2',           // layout + box
    'text-sm text-muted-foreground',                                  // typography
    'transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',   // interaction
    selected && 'bg-accent text-accent-foreground',
    className,
  )}
/>
```

If the same multi-line string appears again, it wants to be a component
or a `cva` variant ([reusable-patterns.md](reusable-patterns.md)).

## Conditional classes

```tsx
cn('base', isActive && 'bg-primary', { 'opacity-50': disabled })
```

Never string-concatenate partial class names (`bg-${color}-500`); Tailwind
can't detect them and they won't be generated. Map to full class strings.

## Arbitrary values

`w-[calc(100%-2rem)]`, `min-h-[35vh]` are fine occasionally. If an
arbitrary value repeats, promote it to a token (`--spacing-sidebar`).

## Linting

- `eslint-plugin-tailwindcss` (or the v4-compatible successor) catches contradicting classes and unknown utilities.
- Prettier plugin for ordering.

## Related

- [design-tokens.md](design-tokens.md)
- [avoiding-duplication.md](avoiding-duplication.md)
