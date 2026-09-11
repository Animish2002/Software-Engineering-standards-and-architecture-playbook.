# Applying server validation errors to a form

```ts
// components/forms/apply-server-errors.ts
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { ApiFailure } from '@/lib/http';

type FieldErrors = Record<string, string[] | undefined>;

export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, error: ApiFailure): boolean {
  if (error.code !== 'VALIDATION_FAILED' || !error.details || typeof error.details !== 'object') return false;
  const details = error.details as FieldErrors;
  const known = new Set(Object.keys(form.getValues()));
  let applied = false;
  for (const [field, messages] of Object.entries(details)) {
    const message = messages?.[0];
    if (!message) continue;
    const root = field.split('.')[0]!;
    if (known.has(root)) { form.setError(field as Path<T>, { type: 'server', message }); applied = true; }
    else form.setError('root.server' as Path<T>, { type: 'server', message: `${field}: ${message}` });
  }
  return applied;
}
```

```tsx
// usage
async function onSubmit(values: CreateUserInput) {
  const res = await create.mutateAsync(values);
  if (!res.ok) {
    if (!applyServerErrors(form, res.error)) toast.error(res.error.message);
    return;
  }
  toast.success('Created');
}
{form.formState.errors.root?.server && <p className="text-sm text-destructive">{form.formState.errors.root.server.message}</p>}
```

Related: [10-frontend/forms-and-validation.md](../../10-frontend/forms-and-validation.md)
