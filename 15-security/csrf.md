# CSRF (cross-site request forgery)

## What is it?

A malicious site causes the victim's browser to send a request to your API
with the victim's cookies attached. If your API authenticates by cookie
alone and accepts that request, the attacker acts as the victim.

## When does it apply?

| Auth mechanism | Vulnerable? |
| --- | --- |
| `Authorization: Bearer` header (access JWT in memory) | **No**: other sites can't set your header |
| Cookie with `SameSite=Lax` or `Strict` | Mostly protected for POST/PATCH/DELETE from cross-site contexts; `Lax` still sends cookies on top-level GET navigations, so **GET must never mutate** |
| Cookie with `SameSite=None` | **Yes**; needs a CSRF token |
| Cookie-authenticated endpoints reachable via form POST | Yes unless `SameSite` blocks it and the request needs a JSON content type (simple forms can't send `application/json`) |

In the recommended design, only `/auth/refresh` and `/auth/logout` use
the cookie. Refresh returns a new access token in the body; a forged
refresh request gives the attacker nothing (they can't read the response
cross-origin, and CORS blocks it). Logout by CSRF is a nuisance, not a
breach. Still set `SameSite=Lax` and `path=/auth`.

## Controls, in order

1. **`SameSite=Lax`** (or `Strict`) on every auth cookie.
2. **No state changes on GET.**
3. **JSON-only bodies** (`Content-Type: application/json` required; 415 otherwise): HTML forms can't produce them, and a cross-origin `fetch` with that header triggers a CORS preflight that your exact-origin CORS rejects.
4. **Exact-origin CORS**; never reflect arbitrary origins with credentials.
5. **Origin/Referer check** on cookie-authenticated mutating routes as belt-and-braces: reject if `Origin` isn't your frontend.
6. **CSRF token** (double-submit or synchroniser) only if you must use `SameSite=None` cookies for mutating endpoints (cross-site embedding, third-party domains).

## Server sessions design

If the whole API is cookie-authenticated (server sessions), apply 1-5
and consider 6 for form-heavy flows. Modern browsers' `Lax` default plus
JSON-only + Origin check is sufficient for an SPA on the same site.

## Related

- [sessions.md](sessions.md)
- [cors.md](cors.md)
