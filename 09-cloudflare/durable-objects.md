# Durable Objects

## What is it?

A single-instance, globally addressable object with its own storage and
single-threaded execution. All requests for a given id go to the same
instance, so it can coordinate: counters, locks, rate limits with exact
counts, WebSocket rooms, per-document collaboration state.

## When should I use it?

- You need **strong consistency** per entity at the edge (exactly-once counters, "only one active session per user", per-room ordering).
- **WebSockets** with fan-out (chat, live cursors, presence) on Workers.
- Per-entity queues or state machines that must serialise operations.

## When should I NOT use it?

- Plain CRUD. Use Postgres/D1.
- Caching. Use KV/Cache API.
- Anything that would route *all* traffic through one object (a global counter): that object becomes the bottleneck. Shard by key.
- If you're on Node (Express) and don't otherwise need Workers. A Postgres row lock or a Redis key does the same job there.

## Shape

```ts
export class Room extends DurableObject<Env> {
  async fetch(request: Request) {
    if (request.headers.get('Upgrade') === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);       // hibernation API: cheap idle connections
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('expected websocket', { status: 400 });
  }
  async webSocketMessage(ws: WebSocket, msg: string) {
    for (const peer of this.ctx.getWebSockets()) if (peer !== ws) peer.send(msg);
  }
  async increment() {
    const n = ((await this.ctx.storage.get<number>('n')) ?? 0) + 1;
    await this.ctx.storage.put('n', n);
    return n;
  }
}

// from a Worker
const id = env.ROOMS.idFromName(roomId);
const stub = env.ROOMS.get(id);
await stub.increment();     // RPC
```

## Rules

- One object per entity (`idFromName(userId)`), never one global object.
- Keep state in `ctx.storage` (transactional, persisted), not in instance fields alone (instances can be evicted).
- Use the WebSocket **hibernation** API so idle sockets cost nothing.
- Objects are single-threaded: long `await`s block other requests to the same object; keep operations short.
- Storage is per object; cross-object queries don't exist. Mirror what you need to query into D1/Postgres.

## Related

- [bindings.md](bindings.md)
- [queues.md](queues.md)
