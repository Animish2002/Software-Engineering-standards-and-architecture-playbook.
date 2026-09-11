# Async/await and Promises

Node/backend-specific concurrency patterns (bounded concurrency, retries,
timers) are in [06-nodejs/async-patterns.md](../06-nodejs/async-patterns.md).
This page is the language mechanics.

## The three states

A Promise is **pending**, then settles exactly once to **fulfilled** (with
a value) or **rejected** (with a reason). Once settled, it never changes.

## `async`/`await` is sugar over `.then`

```ts
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
// equivalent to
function getUser(id: string) {
  return fetch(`/api/users/${id}`).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  });
}
```

An `async function` always returns a Promise, even if the body has no
`await`. A thrown error inside becomes a rejected Promise.

## Error handling

```ts
try {
  const user = await getUser(id);
} catch (err) {
  // err is unknown in TS — narrow before using
  if (err instanceof Error) log.error({ err }, 'failed to load user');
}
```

```ts
// Avoid: swallowing without deciding
try { await sendEmail(user); } catch {}
// Recommended: decide explicitly
try { await sendEmail(user); } catch (err) { log.warn({ err, userId: user.id }, 'email failed'); }
```

## Sequential vs concurrent

```ts
// Sequential — only when the second depends on the first's result
const user = await getUser(id);
const orders = await getOrders(user.id);

// Concurrent — when independent (the default for unrelated data)
const [user, settings] = await Promise.all([getUser(id), getSettings(id)]);
```

`await` inside a loop runs sequentially — often unintentional:

```ts
// Avoid: N sequential round trips
for (const id of ids) results.push(await fetchOne(id));
// Recommended
const results = await Promise.all(ids.map(fetchOne));
```

See [06-nodejs/async-patterns.md](../06-nodejs/async-patterns.md) for
bounding concurrency when the list is large.

## `Promise.all` vs `allSettled` vs `race` vs `any`

| Method | Behaviour | Use |
| --- | --- | --- |
| `Promise.all` | Rejects as soon as one rejects | All must succeed |
| `Promise.allSettled` | Always resolves; each result is `{status, value\|reason}` | Independent operations where partial failure is fine (bulk email) |
| `Promise.race` | Settles when the first settles (fulfilled or rejected) | Timeouts: `Promise.race([task, timeout])` |
| `Promise.any` | Resolves on the first fulfillment; rejects only if all reject | First successful result from redundant sources |

## Common mistakes

```ts
// Avoid: the executor swallows errors — nothing catches a throw inside it
new Promise(async (resolve) => {
  const data = await fetchData();     // if this throws, it's an unhandled rejection, not caught by outer try/catch
  resolve(data);
});
// Recommended: don't wrap an already-async operation in `new Promise`
const data = await fetchData();
```

```ts
// Avoid: async function passed where a sync callback is expected
items.forEach(async (item) => { await process(item); });   // forEach doesn't await; all fire concurrently, unbounded, errors are unhandled rejections
// Recommended
for (const item of items) await process(item);              // sequential
// or
await Promise.all(items.map(process));                      // concurrent
```

```ts
// Avoid: returning a promise from a non-async function without awaiting inside a try/catch that needs it
function getUser(id: string) {
  try { return fetchUser(id); }        // if fetchUser rejects, this try/catch never sees it — it's not awaited here
  catch (err) { return null; }
}
```

## Related

- [06-nodejs/async-patterns.md](../06-nodejs/async-patterns.md)
- [event-loop.md](event-loop.md)
- [anti-patterns.md](anti-patterns.md)
