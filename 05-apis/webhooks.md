# Webhooks

## Receiving webhooks (from payment providers, email providers, Git hosts)

1. **Verify the signature** before parsing anything: HMAC over the raw body with the provider's secret, constant-time comparison, timestamp tolerance to prevent replay. Read the raw body (`express.raw({ type: 'application/json' })` on that route only).
2. **Respond fast** (2xx within a few seconds). Do the work asynchronously: store the event, enqueue a job, return 200.
3. **Idempotent processing**: store the provider's event id with a unique constraint; skip duplicates. Providers retry.
4. **Order is not guaranteed.** Handle "refund" arriving before "payment" by reading current state, not by assuming sequence.
5. **Log every event** with its id and outcome; keep the raw payload (JSONB) for debugging.
6. **Return 2xx even for events you don't handle** (unknown type → log and 200), or the provider keeps retrying.
7. **Never expose the endpoint without verification**; a public POST that changes state is an attack surface.

```ts
router.post('/webhooks/payments', express.raw({ type: '*/*' }), async (req, res) => {
  const sig = req.get('X-Signature');
  if (!verifySignature(req.body, sig, config.PAYMENTS_WEBHOOK_SECRET)) return res.status(400).json(fail('Invalid signature', 'INVALID_SIGNATURE'));
  const event = eventSchema.parse(JSON.parse(req.body.toString()));
  const inserted = await webhookEventsRepo.insertIfNew(event);   // ON CONFLICT DO NOTHING on provider_event_id
  if (inserted) await jobs.enqueue('payments.event', { eventId: event.id });
  res.status(200).json(ok({ received: true }));
});
```

## Sending webhooks (to your customers)

- Sign every payload (HMAC-SHA256 with a per-endpoint secret) and include a timestamp and event id.
- Deliver from a job with retries and exponential backoff (e.g., 1 m, 5 m, 30 m, 2 h, 12 h); stop after N attempts and mark the endpoint failing.
- Timeouts of a few seconds; treat any non-2xx as failure.
- Let customers replay events from a log.
- Never include secrets or other tenants' data in payloads; include ids and let them fetch details.

## Related

- [idempotency.md](idempotency.md)
- [02-backend/background-jobs.md](../02-backend/background-jobs.md)
