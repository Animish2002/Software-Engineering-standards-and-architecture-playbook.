# Microservices

## What is it?

Independently deployable services, each owning its data, communicating over
the network (HTTP/gRPC/queues). Every function call across a boundary becomes
a network call with its own failure modes.

## Why does it matter?

Microservices solve organisational and scaling problems that large teams
have. For small teams they *create* those problems: distributed
transactions, versioned contracts, service discovery, per-service CI/CD,
observability across hops, and a debugging experience that requires tracing.

## When should I use it?

All of the following, not one:

- Multiple teams need to deploy independently and their coordination cost is measured, not imagined.
- A component's scaling or runtime profile is fundamentally different (GPU inference, video processing, a third-party-imposed runtime).
- Data isolation is legally required between components.
- You already have a modular monolith with clean boundaries and one module is the bottleneck.

## When should I NOT use it?

- Team of fewer than ~10 engineers.
- The domain is still changing (boundaries you draw now will be wrong).
- "Because it scales." A monolith on two instances behind a load balancer scales further than most products need.
- "To use different languages." That is a cost, not a benefit.

## Recommended approach (if you truly need it)

1. **Start from a modular monolith.** Extract the one module with the proven need. Keep the rest.
2. **Own your data.** Each service has its own database or schema. No shared tables. Other services get data through the owning service's API or through published events.
3. **Sync for queries, async for effects.** Read via HTTP; propagate state changes via a queue (Cloudflare Queues, SQS, or a Postgres-backed outbox at small scale) so a downstream outage doesn't fail the upstream request.
4. **Contracts are versioned and validated** on both sides with shared Zod schemas from a package.
5. **Idempotent consumers.** Every message may be delivered twice. See [05-apis/idempotency.md](../05-apis/idempotency.md).
6. **Observability first.** Request ids propagate across hops (`traceparent` header); structured logs with service name; a place to see them together.
7. **One CI/CD pipeline per service**, from the same template ([18-devops/ci-cd.md](../18-devops/ci-cd.md)).

```text
                        ┌────────────┐   events    ┌──────────────┐
  client ─► gateway ─►  │ core-api   │ ──────────► │ media-worker │
                        │ (monolith) │             │  (transcode) │
                        └─────┬──────┘             └──────┬───────┘
                              │ own DB                    │ own storage
```

A monolith plus one extracted worker is the realistic end state for most
products that "went microservices".

## Bad example

```text
user-service, auth-service, email-service, order-service, payment-service,
notification-service, gateway, config-service ... for a 3-person team and
2,000 users.
```

Eight deployables, eight databases, distributed transactions for "place
order", and a week of debugging when the auth-service token cache is stale.

## Common mistakes

- A shared database behind several services (a distributed monolith: all the cost, none of the isolation).
- Synchronous call chains three services deep. Latency and failure compound.
- Splitting by technical layer (an "API service" and a "DB service").
- No idempotency, so retries duplicate side effects.

## Production considerations

- Every network hop needs a timeout, a retry policy with backoff, and a circuit breaker or bulkhead.
- Health checks per service; deploy order matters for contract changes (expand, migrate, contract).
- Cost: each service has a baseline of compute, logs, alerts, and on-call attention.

## Checklist (only if extracting)

- [ ] The extraction reason is written down and measured.
- [ ] The extracted module already had a clean boundary in the monolith.
- [ ] It owns its data; no shared tables.
- [ ] Contracts are shared Zod schemas, versioned.
- [ ] Messages are idempotent and retried with backoff.
- [ ] Request ids propagate across the hop.

## Related

- [modular-monolith.md](modular-monolith.md)
- [choosing-an-architecture.md](choosing-an-architecture.md)
- [09-cloudflare/queues.md](../09-cloudflare/queues.md)
