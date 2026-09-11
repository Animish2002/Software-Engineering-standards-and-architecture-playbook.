# Common anti-patterns

Concrete mistakes that show up in review, each with the fix.

## Mutating function arguments

```ts
// Avoid
function addDefaults(options) { options.timeout ??= 5000; return options; }   // mutates the caller's object
// Recommended
function addDefaults(options) { return { timeout: 5000, ...options }; }
```

## Using `==` instead of `===`

Covered in [types-and-coercion.md](types-and-coercion.md). Enforce with
ESLint (`eqeqeq: 'error'`).

## `for...in` on arrays

```ts
// Avoid: iterates keys as strings, includes inherited enumerable properties, order not guaranteed for arrays
for (const i in items) { console.log(items[i]); }
// Recommended
for (const item of items) { console.log(item); }
for (const [i, item] of items.entries()) { }   // when the index is genuinely needed
```

## Array index as a React key for reorderable/filterable lists

```tsx
// Avoid: index changes when items are added/removed/reordered — React misassociates state
{items.map((item, i) => <Row key={i} {...item} />)}
// Recommended
{items.map((item) => <Row key={item.id} {...item} />)}
```

## Deeply nested callbacks instead of async/await

```ts
// Avoid
getUser(id, (user) => { getOrders(user.id, (orders) => { getItems(orders[0].id, (items) => { /* ... */ }); }); });
// Recommended
const user = await getUser(id);
const orders = await getOrders(user.id);
const items = await getItems(orders[0].id);
```

## Catching an error just to re-throw it unchanged

```ts
// Avoid: adds nothing, obscures the original stack
try { await doWork(); } catch (err) { throw err; }
// Recommended: let it propagate, or add real context
try { await doWork(); } catch (err) { throw new AppError('Work failed', 500, 'WORK_FAILED', undefined, { cause: err }); }
```

## Checking `typeof x === 'undefined'` instead of using the value directly

```ts
// Avoid
if (typeof user.name !== 'undefined') { }
// Recommended
if (user.name != null) { }        // or user.name !== undefined if null is a distinct valid state
```

## Reassigning function parameters

```ts
// Avoid: confusing — the parameter now means something different partway through
function formatPrice(price) { price = price.toFixed(2); return `$${price}`; }
// Recommended
function formatPrice(price: number) { const formatted = price.toFixed(2); return `$${formatted}`; }
```

## Boolean parameters that require reading the call site

```ts
// Avoid: what does `true` mean here without looking up the signature?
createUser(input, true);
// Recommended: named via an options object
createUser(input, { sendWelcomeEmail: true });
```

Also covered in [00-engineering-principles/clean-code.md](../00-engineering-principles/clean-code.md).

## Over-using `any` to silence TypeScript

```ts
// Avoid
function process(data: any) { return data.items.map((i: any) => i.value); }
// Recommended: type it, or use unknown + narrowing/parsing at the boundary
const process = (data: ProcessInput) => data.items.map((i) => i.value);
```

## Unbounded recursion on user-controlled depth

```ts
// Avoid: a deeply nested or cyclic input causes a stack overflow
function sumNested(node) { return node.value + (node.children ?? []).reduce((s, c) => s + sumNested(c), 0); }
// Recommended: bound the depth explicitly
function sumNested(node, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error('Structure too deep');
  return node.value + (node.children ?? []).reduce((s, c) => s + sumNested(c, depth + 1), 0);
}
```

Same principle as the `MAX_FOLDER_DEPTH` guard on recursive SQL CTEs
([03-databases/relationships.md](../03-databases/relationships.md)) —
apply it in application recursion too.

## Comparing objects/arrays with `===`

```ts
[1, 2] === [1, 2];              // false — different references
{ a: 1 } === { a: 1 };            // false
// Compare by value explicitly, or compare the specific field that matters
a.id === b.id;
```

## Related

- [../00-engineering-principles/clean-code.md](../00-engineering-principles/clean-code.md)
- [async.md](async.md)
- [types-and-coercion.md](types-and-coercion.md)
