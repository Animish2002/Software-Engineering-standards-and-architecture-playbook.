# Idempotency

## What is it?

A request that can be safely repeated with the same effect as sending it
once. `GET`, `PUT`, `DELETE` are idempotent by definition. `POST` is not,
and networks retry.

## Why does it matter?

A client times out after the server committed but before the response
arrived. It retries. Without idempotency: two orders, two charges, two
emails.

## When should I implement it?

- Any POST with a costly or visible side effect: payments, order placement, sending messages, creating shares that email people.
- Queue consumers (at-least-once delivery).
- Webhook receivers (providers retry).

## When can I skip it?

- Creates where duplicates are harmless or prevented by a unique constraint (a second `POST /stars/toggle` is *meant* to toggle; a second folder with the same name is rejected by `uq_folders_...`).
- Internal single-frontend apps where the UI disables the button during the request and the cost of a rare duplicate is low. Document the decision.

## Recommended approach: `Idempotency-Key`

```text
POST /orders
Idempotency-Key: 5c0d…-client-generated-uuid
```

Server:

1. Look up `(key, userId)` in an `idempotency_keys` table.
2. If found and the request hash matches: return the **stored response** (same status, same body).
3. If found and the hash differs: `409 CONFLICT` (`IDEMPOTENCY_KEY_REUSED`).
4. If not found: insert `(key, userId, requestHash, status='in_progress')` (unique index makes concurrent duplicates fail → 409 or wait), run the operation, store the response, return it.
5. Expire keys after 24 h.

```sql
create table idempotency_keys (
  key          text not null,
  user_id      uuid not null,
  request_hash text not null,
  status_code  int,
  response     jsonb,
  created_at   timestamptz not null default now(),
  primary key (key, user_id)
);
```

## Natural idempotency (often enough)

- `INSERT ... ON CONFLICT DO NOTHING` keyed on a natural unique key.
- State transitions guarded by the current state: `UPDATE ... WHERE status = 'pending'` (0 rows = already done).
- Deterministic ids: the client generates the resource id; a repeat insert hits the PK.

## Consumers and webhooks

Store processed event ids; skip if seen. Make the handler's effect
repeatable (overwrite, upsert) rather than additive (append, increment).

## Related

- [http-methods.md](http-methods.md)
- [webhooks.md](webhooks.md)
- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
