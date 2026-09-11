# API versioning

## When do I need it?

Only when you cannot change all clients at the same time as the server:
third-party consumers, mobile apps in app stores, partner integrations.

A single web frontend deployed with its API does **not** need URL
versioning. Deploy them together and make changes backwards compatible
during the rollout window.

## Compatible changes (no version needed)

- Adding a field to a response.
- Adding an optional field to a request.
- Adding an endpoint.
- Adding an enum value *that clients are told to tolerate* (unknown values → default branch).
- Relaxing validation.

## Breaking changes (need a version or a migration plan)

- Removing or renaming a field or endpoint.
- Changing a field's type or meaning.
- Making an optional field required.
- Changing the envelope or error codes.
- Tightening validation that previously accepted values.

## Strategies

| Strategy | Shape | Use |
| --- | --- | --- |
| **No versioning + additive changes** (default) | Same URL, evolve compatibly, remove after all clients are migrated | Single first-party frontend |
| **URL prefix** | `/v1/users`, `/v2/users` | Public/partner APIs; clear, cacheable, easy to route |
| Header | `Accept: application/vnd.app.v2+json` | Purist; harder to test and cache; skip |
| Per-endpoint | `/users` unchanged, `/users-v2` | Ugly; avoid |

If you version, version the **whole API** at the prefix, run the old
version for a documented sunset period, log usage by version, and remove it
when traffic reaches zero.

## Deprecation

- Announce with a date; return `Deprecation` and `Sunset` headers on old endpoints.
- Log calls to deprecated endpoints with client identification.

## Related

- [rest-api-design.md](rest-api-design.md)
- [documentation.md](documentation.md)
