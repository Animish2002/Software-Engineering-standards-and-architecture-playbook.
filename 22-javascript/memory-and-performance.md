# Memory and performance (language level)

Node-process-specific diagnosis (heap snapshots, `--max-old-space-size`)
is in [06-nodejs/memory.md](../06-nodejs/memory.md). This page is what
happens at the language level and the costs worth knowing.

## Garbage collection, briefly

V8 (Node, Chrome) uses generational, mark-and-sweep GC: short-lived
objects (most allocations) are collected cheaply from a "young"
generation; objects that survive get promoted and collected less often
from the "old" generation. You don't manage memory manually, but you can
create objects the collector can't reclaim.

## What keeps objects alive longer than intended

| Pattern | Why it leaks |
| --- | --- |
| A growing `Map`/array used as a cache with no eviction | Every entry is reachable forever |
| Event listeners added but never removed | The listener closure (and everything it captures) stays alive as long as the target does |
| `setInterval`/`setTimeout` never cleared | The callback closure is retained until cleared |
| Closures over large objects, attached to long-lived things | See [closures-and-scope.md](closures-and-scope.md) |
| Module-level arrays/maps used as ad hoc queues | Nothing bounds their size |
| React: subscriptions/listeners set up in an effect with no cleanup function | Same as above, scoped to component lifetime |

```tsx
// Avoid: no cleanup — a new listener is added on every mount, old ones never removed
useEffect(() => { window.addEventListener('resize', onResize); }, []);
// Recommended
useEffect(() => { window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
```

## Costs worth knowing (not micro-optimisation, just awareness)

- **Object shape changes are cheap to worry about, expensive to chase.** V8 optimises objects with consistent "shapes" (same properties, same order, added at construction). Don't contort code for this; it matters only in profiled hot loops, and is rarely the actual bottleneck in a CRUD app.
- **Array holes are slower than dense arrays.** `new Array(10)` (sparse) is slower to iterate than `Array.from({length: 10})` or a `.push()`-built array. Rarely matters outside tight loops.
- **String concatenation in a loop**: modern engines optimise `+=` well; it's not the classic problem it was in older engines. Still, `.join()` on an array of parts is clearer for building large strings.
- **`JSON.parse`/`JSON.stringify` of large payloads is synchronous and blocks the event loop** on the backend — see [06-nodejs/event-loop.md](../06-nodejs/event-loop.md). This is the one that actually matters in practice.

## When to actually optimise

Almost never before measuring. See
[17-performance/README.md](../17-performance/README.md) — "measure first,
optimise second" applies at the language level too. A profiler
(`--cpu-prof`, Chrome DevTools Performance/Memory panels) tells you where
time and memory actually go; guessing rarely matches it.

## Related

- [../06-nodejs/memory.md](../06-nodejs/memory.md)
- [closures-and-scope.md](closures-and-scope.md)
- [../17-performance/profiling.md](../17-performance/profiling.md)
