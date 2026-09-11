# The event loop (language-level model)

Node-specific phases and libuv detail are in
[06-nodejs/event-loop.md](../06-nodejs/event-loop.md). This page is the
model shared by browsers and Node: one thread, a call stack, and queues
that feed it.

## The pieces

```text
Call stack        synchronous code executes here, one frame at a time
Microtask queue    Promise .then/.catch/.finally callbacks, queueMicrotask, async/await continuations
Macrotask queue    setTimeout/setInterval callbacks, I/O callbacks, UI events (browser), postMessage
```

## The rule

After each synchronous "task" finishes (the call stack empties), the
engine **drains the entire microtask queue** before running the next
macrotask. This is why Promises resolve before `setTimeout(fn, 0)`:

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
```

`1` and `4` run synchronously. `3` (microtask) runs before `2` (macrotask)
even though both were scheduled for "later."

## `await` yields to the microtask queue

```js
async function f() {
  console.log('a');
  await null;              // yields here — the rest of f() becomes a microtask
  console.log('b');
}
f();
console.log('c');
// Output: a, c, b
```

Every `await` (even `await null` or `await Promise.resolve()`) is a
microtask boundary. This is how a long synchronous-looking `async`
function can still block: **the code between `await`s runs synchronously
on the call stack**, exactly like any other synchronous code.

## Why this matters in practice

```js
// Avoid: this blocks the thread even though it's inside an async function
async function processAll(items) {
  for (const item of items) {
    heavyComputation(item);   // no await — never yields; the whole loop runs as one blocking task
  }
}
// Recommended: yield periodically so other work (I/O, rendering, other requests) can interleave
async function processAll(items) {
  for (const item of items) {
    heavyComputation(item);
    await new Promise((r) => setTimeout(r, 0));   // or Node's timers/promises setImmediate — hands control back
  }
}
```

`async`/`await` does not make code run on another thread. It only
determines *when* the continuation is scheduled relative to other queued
work. CPU-bound work still blocks everything else until it returns or
yields.

## Browser specifics

- The browser also has a **rendering** step that happens after microtasks drain and before the next macrotask (roughly) — a long synchronous handler delays paint.
- `requestAnimationFrame` callbacks run before the next repaint, after event handlers.
- User events (`click`, `input`) are macrotasks; that's why a Promise queued inside a click handler resolves before the next click can be processed, but a synchronous loop in that handler still freezes the UI.

## Related

- [06-nodejs/event-loop.md](../06-nodejs/event-loop.md)
- [async.md](async.md)
