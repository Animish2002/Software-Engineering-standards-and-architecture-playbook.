# Contributing to write-new-ways

This is a personal standards repository, so "contributing" means keeping it
accurate as your practice evolves. The same discipline applies whether the
edit is yours or a collaborator's.

## When to update

- A project taught you something that contradicts a document here.
- A tool's recommended usage changed (new major version, deprecated API).
- You found yourself making the same decision twice without a guide for it.
- A checklist item saved you, or its absence cost you.

Update the same week. Stale standards are worse than none, because they are
followed with confidence.

## How to update

1. Find the single file that owns the topic. If two files cover it, merge them.
2. Edit in place. Keep the standard section order (see below).
3. If the change affects other documents, update their cross-links.
4. Add a line to [CHANGELOG.md](CHANGELOG.md) under the current month.
5. Commit with a conventional message: `docs(databases): recommend keyset pagination over offset by default`.

## Document shape

Most documents use this shape. Omit sections that do not apply; do not pad.

```markdown
# Topic

## What is it?
## Why does it matter?
## When should I use it?
## When should I NOT use it?
## Recommended approach
## Example
## Bad example
## Common mistakes
## Production considerations
## Checklist
## Related
```

## Writing rules

- Prefer a short example over a paragraph of explanation.
- Label code examples **Recommended**, **Alternative**, or **Avoid**.
- Every "always" needs a "except when".
- Do not cite another project as the reason for a decision. State the engineering reason.
- Do not add a technology because it is popular. Add it because a documented need exists, and say which tier it belongs to (core, supporting, optional).
- Do not repeat an explanation that exists elsewhere in the repository. Link to it.
- Keep files under roughly 300 lines. Split by topic, not by length.

## Versions assumed at the time of writing

Re-verify against official documentation when a major version changes.

| Technology | Assumed version | Official reference |
| --- | --- | --- |
| Node.js | 22 LTS or later (24 in use locally) | https://nodejs.org/en/about/previous-releases |
| Express | 5.x | https://expressjs.com |
| Hono | 4.x | https://hono.dev |
| React | 19.x | https://react.dev |
| Vite | 6.x / 7.x | https://vite.dev |
| Tailwind CSS | 4.x (CSS-first configuration) | https://tailwindcss.com/docs |
| shadcn/ui | CLI `npx shadcn@latest` | https://ui.shadcn.com |
| Drizzle ORM | 0.4x / drizzle-kit 0.3x | https://orm.drizzle.team |
| PostgreSQL | 16 or 17 | https://www.postgresql.org/docs/ |
| MySQL | 8.x (InnoDB) | https://dev.mysql.com/doc/ |
| Wrangler | 4.x | https://developers.cloudflare.com/workers/wrangler/ |
| Docker | Engine 27+, Compose v2 | https://docs.docker.com |
| Kubernetes | 1.30+ | https://kubernetes.io/docs/ |
| Zod | 3.x / 4.x | https://zod.dev |
| Arctic (OAuth client) | 3.x | https://arcticjs.dev |
| openid-client | 6.x | https://github.com/panva/openid-client |
| Better Auth | 1.x | https://better-auth.com/docs |
| AWS SDK S3 client | v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) | https://docs.aws.amazon.com/sdk-for-javascript/ |
| file-type | 22.x (ESM-only) | https://github.com/sindresorhus/file-type |
| sharp | 0.35.x | https://sharp.pixelplumbing.com |
| prom-client | 15.x | https://github.com/siimon/prom-client |
| Sentry (Node / React) | 10.x | https://docs.sentry.io |

## Local conventions

- Markdown: ATX headings (`#`), fenced code blocks with a language tag, tables for comparisons.
- File names: lower-kebab-case, `.md`.
- Folder names: `NN-topic` for top-level sections so they sort in reading order.
- Relative links only, so the repository works offline and on GitHub.
