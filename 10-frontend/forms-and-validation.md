# Forms and validation

## Stack

- **react-hook-form** for form state (uncontrolled inputs, minimal re-renders).
- **Zod schema from `packages/validation`** via `zodResolver`: the same rules the API enforces.
- **shadcn `Form` components** for consistent labels, descriptions, and error messages.
- Server `VALIDATION_FAILED` details mapped back onto fields.

## Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserInput } from '@app/validation';

export function CreateUserForm({ onCreated }: { onCreated: (u: User) => void }) {
  const form = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: { email: '', name: '', password: '', roleId: '' } });
  const create = useCreateUser();

  async function onSubmit(values: CreateUserInput) {
    const res = await create.mutateAsync(values);
    if (!res.ok) {
      if (res.error.code === 'VALIDATION_FAILED') applyServerErrors(form, res.error.details);
      else toast.error(res.error.message);
      return;
    }
    toast.success('User created');
    onCreated(res.data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
        <TextField control={form.control} name="name" label="Name" />
        <TextField control={form.control} name="password" label="Temporary password" type="password" />
        <SelectField control={form.control} name="roleId" label="Role" options={roleOptions} />
        <Button type="submit" disabled={form.formState.isSubmitting}>Create</Button>
      </form>
    </Form>
  );
}
```

`TextField`/`SelectField` are thin wrappers in `components/forms/` that
combine shadcn's `FormField` + `FormItem` + `FormLabel` + `FormControl` +
`FormMessage`, so every form field looks the same and no page hand-writes
that block.

```ts
// components/forms/apply-server-errors.ts
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, details: unknown) {
  if (!details || typeof details !== 'object') return;
  for (const [field, messages] of Object.entries(details as Record<string, string[]>)) {
    form.setError(field as Path<T>, { type: 'server', message: messages[0] });
  }
}
```

## Rules

- **One schema, two consumers.** Never re-type rules in the component.
- **Disable submit while submitting**; show inline field errors; a toast for non-field errors.
- **Default values always provided** so inputs are never uncontrolled→controlled.
- **Password fields** have `autoComplete` set (`new-password`/`current-password`).
- **Destructive confirmations** use `AlertDialog`, never `confirm()`.
- **Dialog forms** reset on close (`form.reset()` in `onOpenChange`).
- **Multi-select pickers** (recipients) fetch their options once on first open and filter client-side when the set is small.

## When not to use react-hook-form

A single input with a button (search box, rename inline): `useState` is
fine. Don't wrap trivial inputs in a form library.

## Related

- [components/catalog.md](components/catalog.md) (reusable form fields)
- [12-shadcn/README.md](../12-shadcn/README.md)
- [05-apis/request-validation.md](../05-apis/request-validation.md)
