# Closures and scope

## Lexical scope

A function's scope is determined by where it is **written**, not where
it's called. Every function remembers the variables visible at its
definition site.

```ts
function outer() {
  const secret = 42;
  return function inner() { return secret; };   // inner "closes over" secret
}
const fn = outer();
fn();   // 42 — secret is still accessible even though outer() has returned
```

## `var` vs `let`/`const`

`var` is function-scoped and hoisted with `undefined`; `let`/`const` are
block-scoped and live in a "temporal dead zone" until their declaration
runs. Use `let`/`const` exclusively — `var`'s function scoping causes the
classic loop bug:

```js
// Avoid: var is shared across all iterations — every callback logs 3
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 3, 3, 3

// Recommended: let creates a new binding per iteration
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 0, 1, 2
```

## Closures over mutable state

The classic pitfall: a closure captures the **variable**, not its value
at closure-creation time.

```ts
// Avoid: all three buttons alert "3" — they share one closure over count
let count = 0;
function makeHandlers() {
  const handlers = [];
  for (let i = 0; i < 3; i++) {
    handlers.push(() => { count++; alert(count); });   // fine — count is meant to be shared
  }
  return handlers;
}
```

```ts
// A real bug: capturing a loop variable expected to be per-item, without let
function attachHandlers(items: HTMLElement[]) {
  for (var i = 0; i < items.length; i++) {
    items[i].onclick = () => console.log(`clicked item ${i}`);   // logs items.length every time — var
  }
}
```

## Closures for encapsulation (module pattern)

```ts
function createCounter(initial = 0) {
  let count = initial;                       // private — inaccessible from outside
  return {
    increment: () => ++count,
    reset: () => { count = initial; },
    get value() { return count; },
  };
}
const counter = createCounter();
counter.increment();
// counter.count is undefined — no direct access
```

Useful for small stateful utilities (a debounced function's timer id, a
memoisation cache) without a class.

## Closures in React

Every render creates new closures. A stale closure in an event handler or
effect is one of the most common React bugs:

```tsx
// Avoid: the effect's closure captures the initial `count` forever
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);   // count is always 0 here
    return () => clearInterval(id);
  }, []);                                                       // empty deps — closure never refreshes
}
// Recommended: use the updater form, which doesn't need the stale value
useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(id);
}, []);
```

See [10-frontend/react/hooks.md](../10-frontend/react/hooks.md) for the
full effect-dependency discussion.

## Memory: closures keep their scope alive

A closure retains a reference to its entire enclosing scope, not just the
variables it uses. A long-lived closure (an event listener, a cached
callback) over a scope containing a large object keeps that object from
being garbage-collected.

```ts
// Avoid: the closure keeps `largeBuffer` alive as long as the listener exists
function attach(largeBuffer: Uint8Array) {
  window.addEventListener('resize', () => console.log('resized'));   // doesn't use largeBuffer, but still closes over the whole scope in some engines' worst case
}
```

In practice modern engines are good at trimming unused bindings, but when
a closure is genuinely long-lived (a module-level cache, a subscription
kept for the app's lifetime), avoid capturing large objects you don't
need — capture just the small values (an id) and look the rest up when
needed.

## Related

- [../10-frontend/react/hooks.md](../10-frontend/react/hooks.md)
- [memory-and-performance.md](memory-and-performance.md)
