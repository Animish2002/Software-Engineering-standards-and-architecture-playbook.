# Controlled vs uncontrolled in shared components

## The rule for shared components

Support both: `value` + `onValueChange` (controlled) and `defaultValue`
(uncontrolled), the way Radix primitives do. Consumers pick per use.

```tsx
function useControllableState<T>({ value, defaultValue, onChange }: { value?: T; defaultValue: T; onChange?: (v: T) => void }) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const set = useCallback((next: T) => { if (!isControlled) setInternal(next); onChange?.(next); }, [isControlled, onChange]);
  return [current, set] as const;
}

export function SearchInput({ value, defaultValue = '', onValueChange, ...props }: SearchInputProps) {
  const [q, setQ] = useControllableState({ value, defaultValue, onChange: onValueChange });
  return <Input value={q} onChange={(e) => setQ(e.target.value)} {...props} />;
}
```

## When to control from the page

- The value drives other UI immediately (search filters a list; selected rows enable a bulk action).
- The value lives in the URL (page, sort, filters).
- Two components must agree (a filter bar and a chip list).

## When to leave uncontrolled

- Forms (react-hook-form registers uncontrolled inputs for performance).
- Disclosure state nobody else needs (a collapsible section, a tooltip).
- Dialogs opened from a trigger with no external control needed (`<Dialog><DialogTrigger/>…</Dialog>`).

## Dialog open state

Prefer controlled `open`/`onOpenChange` when the dialog is opened from a
menu or programmatically (after an action), so the page can close it on
success. Trigger-based uncontrolled when it's a simple button → dialog.

## Rules

- Never switch a component between controlled and uncontrolled after mount (React warns; state gets lost).
- Controlled components must call `onValueChange` for every change and render exactly `value`.
- Provide `defaultValue` defaults so uncontrolled use needs no props.

## Related

- [../react/patterns.md](../react/patterns.md)
- [../forms-and-validation.md](../forms-and-validation.md)
