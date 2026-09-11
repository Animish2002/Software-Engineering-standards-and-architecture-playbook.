# Ids and tokens

```ts
// lib/ids.ts (Node)
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { uuidv7 } from 'uuidv7';

/** Opaque token for links, refresh, reset: 32 random bytes, base64url (43 chars). */
export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

/** Store this, never the raw token. */
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Compare two hashes in constant time. */
export const hashesEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Time-ordered UUID for primary keys (better B-tree locality than v4). */
export const newId = () => uuidv7();

/** Storage key: owner-scoped, unguessable, extension-free. */
export const newStorageKey = (ownerId: string) => `${ownerId}/${uuidv7()}`;
```

```ts
// Web Crypto variant (Workers / browser)
export const newToken = (bytes = 32) => {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

Related: [15-security/sessions.md](../../15-security/sessions.md), [03-databases/primary-keys.md](../../03-databases/primary-keys.md)
