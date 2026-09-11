# Logging in Node.js (pino)

Principles in [00-engineering-principles/logging.md](../00-engineering-principles/logging.md).

## Setup

```ts
// lib/logger.ts
import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'api', env: config.NODE_ENV },
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.token', '*.accessToken', '*.refreshToken'], censor: '[redacted]' },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
});
```

- JSON to stdout in production; pretty only in development.
- `pino-pretty` is a dev dependency; never in the production transport (it runs in a worker thread and adds overhead).
- Child loggers per request (`logger.child({ reqId })`) so every line carries the id.

## Usage

```ts
logger.info({ userId, folderId }, 'folder.created');       // object first, message second
logger.warn({ err, userId }, 'welcome email failed');       // `err` key gets the error serializer
logger.error({ err, reqId }, 'unhandled');
```

Not `logger.info('created folder ' + id)`: string concatenation defeats
structured search.

## Levels

- `fatal`: process is exiting.
- `error`: a request failed unexpectedly (5xx) or an invariant broke.
- `warn`: handled degradation (email failed, retry succeeded, deprecated call).
- `info`: request summaries, business events, startup/shutdown.
- `debug`: development detail (SQL, cache hits). Off in production unless investigating.

## Performance

pino is asynchronous by default when writing to stdout via `pino.destination({ sync: false })`; the default is fine. Avoid logging in tight loops; sample if a line could fire thousands of times per second.

## Request logging

Prefer the hand-rolled middleware in [02-backend/logging.md](../02-backend/logging.md) over `pino-http`'s defaults: log the **route pattern**, skip health checks, include the user id after auth.

## Related

- [02-backend/logging.md](../02-backend/logging.md)
