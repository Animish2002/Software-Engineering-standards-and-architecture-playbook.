# 06 — Node.js

Runtime behaviour and production configuration for Node.js services.
Language-level material (syntax, closures, promises) is in
[22-javascript/](../22-javascript/README.md); framework structure is in
[07-express/](../07-express/README.md) and [08-hono/](../08-hono/README.md).

| Document | Answers |
| --- | --- |
| [project-structure.md](project-structure.md) | Files, entrypoints, TypeScript build, scripts for a Node service. |
| [modules.md](modules.md) | ESM vs CJS, `exports`, path aliases, `node:` imports. |
| [event-loop.md](event-loop.md) | Why blocking the loop kills throughput; how to see it. |
| [async-patterns.md](async-patterns.md) | Promises, concurrency limits, cancellation, timers. |
| [streams.md](streams.md) | Streams and buffers for large data; `pipeline`; Web Streams. |
| [error-handling.md](error-handling.md) | Process-level errors, `unhandledRejection`, exit codes. |
| [graceful-shutdown.md](graceful-shutdown.md) | Signals, draining, timeouts. |
| [process-management.md](process-management.md) | One process per container; when clustering or worker threads apply. |
| [environment-variables.md](environment-variables.md) | Loading, validation, `--env-file`. |
| [logging.md](logging.md) | pino setup and pitfalls. |
| [performance.md](performance.md) | Measuring, common wins, what not to bother with. |
| [memory.md](memory.md) | Leaks, heap limits, diagnosing. |
| [production-checklist.md](production-checklist.md) | The one-page pre-deploy list. |

## Version policy

Run the current **LTS** line (even-numbered majors; 22 or 24 at the time of
writing). Pin the major in `package.json` `engines` and in the Dockerfile
base image; upgrade within a few months of a new LTS.
