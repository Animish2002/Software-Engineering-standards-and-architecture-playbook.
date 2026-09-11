# Single responsibility

## What is it?

A unit of code (function, module, component, service) should have **one
reason to change**. Not "does one thing" in the trivial sense; rather, only one
kind of stakeholder or requirement change should force an edit.

## Why does it matter?

Units with several reasons to change are edited often, by different people,
for unrelated reasons. They accumulate conditionals, grow long, and become the
files everyone fears. Units with one reason stay small and are safe to change.

## How to size a unit

Ask: "If requirement X changes, what do I edit?" The answer should be one
place. Then ask: "What else would force me to edit this same place?" If the
answer is an unrelated requirement, split.

| Unit | One responsibility looks like | Too many looks like |
| --- | --- | --- |
| Function | `calculateShipping(order)` | `processOrder()` that validates, prices, charges, emails |
| Module | `users.service.js` (user rules) | `helpers.js` with date, string, and auth utilities |
| React component | `OrderSummary` renders totals | `OrdersPage` fetches, filters, paginates, renders rows, and edits |
| Service | Billing calculations | Billing + notifications + reporting |
| Database table | `orders` | `orders` with 14 nullable columns for three different order types |

## Recommended approach

1. Name the unit. If the name needs "and", split it.
2. Keep orchestration separate from work. A service method that calls three
   other functions in order is fine; a service method that *also* implements
   those three things is not.
3. Let components be either **containers** (fetch, state, coordination) or
   **presentational** (props in, UI out). Mixing both in one component is
   acceptable for small leaf screens; split as soon as either half is reused.

## Example

```ts
// Recommended: orchestration and work are separated
export async function placeOrder(input: PlaceOrderInput, actor: Actor) {
  const order = buildOrder(input, actor);          // pure
  assertInventoryAvailable(order);                  // rule
  const saved = await ordersRepo.insert(order);     // persistence
  await paymentGateway.charge(saved);               // integration
  void notifications.orderPlaced(saved);            // side effect, non-blocking
  return saved;
}
```

Each called function has one reason to change: pricing, inventory rules,
schema, payment provider, notification channel.

## Bad example

```jsx
// Avoid: one component with five responsibilities
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { fetch('/api/users?q=' + q).then(r => r.json()).then(setUsers); }, [q]);
  const filtered = users.filter(u => !u.deleted);
  const onDelete = async (id) => { await fetch('/api/users/' + id, { method: 'DELETE' }); /* ... */ };
  return (/* 150 lines of table, filters, dialogs, and toasts */);
}
```

Split: `useUsers(q)` hook (data), `UsersTable` (display), `UserFilters`
(input), `DeleteUserDialog` (one interaction), `UsersPage` (composition).

## When should I NOT split?

- When the pieces always change together. Splitting them scatters one concern across files.
- When the split creates a unit with no meaningful name (`Helper2`, `Part B`).
- Under roughly 50 lines with one obvious purpose, leave it.

## Common mistakes

- Reading SRP as "one function per file". Files group related responsibilities; that is fine.
- Splitting a component into container and presentational pairs for every screen, including ones that are never reused.
- "Manager", "Handler", "Processor" names: they signal a unit that does several things.

## Checklist

- [ ] Every module's name describes all of its contents.
- [ ] No function or component needs "and" in its description.
- [ ] Orchestration code is separated from the work it orchestrates.
- [ ] Changing one requirement touches one place.

## Related

- [separation-of-concerns.md](separation-of-concerns.md)
- [10-frontend/components/README.md](../10-frontend/components/README.md)
