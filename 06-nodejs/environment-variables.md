# Environment variables in Node.js

The config-module pattern is in
[00-engineering-principles/configuration-management.md](../00-engineering-principles/configuration-management.md).
This page is the Node mechanics.

## Loading

| Context | How |
| --- | --- |
| Local dev | `node --env-file=.env.local src/server.js` or `tsx --env-file=../../.env.local src/server.ts` (Node ≥ 20.6). No `dotenv` package needed. |
| Tests | `--env-file=.env.test` in the test script, or CI job variables |
| Production | Platform-injected variables. Never ship a `.env` file in the image. |

If you must use `dotenv`, call it **first** in the entrypoint (`import 'dotenv/config'` as the first import) because ESM imports are hoisted and other modules may read `process.env` at import time.

## Rules

- Read `process.env` in exactly one module (`config.ts`) and validate with Zod.
- Everything in `process.env` is a **string**. Coerce numbers and booleans in the schema (`z.coerce.number()`, `z.enum(['true','false']).transform(v => v === 'true')`).
- No defaults for secrets; defaults for ports and log levels are fine.
- Frontend variables are a separate concern (`VITE_*`, build-time, public).

## Multiline and special values

Private keys with newlines: store base64-encoded and decode in config, or
rely on the platform's multiline support and `replace(/\\n/g, '\n')` if
they arrive escaped.

## Printing config at boot

Log the non-secret subset (names and values) at startup so a
misconfiguration is visible in the first log lines. Never log secrets, even
truncated.

## Related

- [02-backend/configuration.md](../02-backend/configuration.md)
- [15-security/secrets.md](../15-security/secrets.md)
