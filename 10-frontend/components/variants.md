# Variants

## Visual variants: `cva`

`class-variance-authority` maps named variants to Tailwind classes, once,
with types.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      outline: 'text-foreground',
    },
    size: { sm: 'px-1.5 text-[11px]', md: '' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;
export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
```

- Variants are **named by meaning** (`destructive`, `secondary`), not by colour (`red`).
- `defaultVariants` so the common case needs no props.
- `className` merged last with `cn` (tailwind-merge) so consumers can override.
- Compound variants for combinations that need special casing.

## Behavioural variants: separate components

```tsx
// Avoid
<Dialog mode="confirm" | "form" | "wizard" />
// Recommended
<ConfirmDialog />   <FormDialog />   <WizardDialog />   // each built on the same Dialog primitive
```

A `mode` prop that changes what the component *does* means it's several
components sharing a primitive. Split them; share the primitive.

## Semantic presets

When the same variant is picked from the same data everywhere
(status → badge colour), centralise the mapping once:

```ts
export const shareStatusBadge: Record<ShareStatus, VariantProps<typeof badgeVariants>['variant']> = { active: 'default', revoked: 'secondary', expired: 'outline' };
<Badge variant={shareStatusBadge[share.status]}>{share.status}</Badge>
```

## Don't

- Boolean props for styles (`primary`, `large`, `danger`) that can conflict. One `variant`, one `size`.
- Inline conditional class strings in every consumer for the same variant.
- A variant per page ("usersTable" variant). Variants are design-level, not page-level.

## Related

- [../../11-tailwind/reusable-patterns.md](../../11-tailwind/reusable-patterns.md)
- [../../12-shadcn/variants.md](../../12-shadcn/variants.md)
