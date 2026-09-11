# Secrets management

## What counts as a secret

Database URLs with passwords, JWT signing secrets, API keys (email,
payments, storage), OAuth client secrets, private keys, webhook signing
secrets, encryption keys, CI deploy tokens.

## Where secrets live

| Environment | Store | Injected as |
| --- | --- | --- |
| Local | `.env.local` / `.dev.vars` (git-ignored); optionally a password manager CLI | env vars |
| CI | GitHub Actions secrets (repository or environment-scoped) | env vars for the job |
| Railway / Render / Fly | Platform variables | env vars |
| Cloudflare Workers | `wrangler secret put` | `env.NAME` |
| Kubernetes | External secret store → Secret | env vars / files |

## Rules

| Rule | Why |
| --- | --- |
| Never in Git, including history | Rotate anything that was ever committed; assume it's public |
| Never in Docker images or build args | Layers persist |
| Never in URLs | Logs, referrers, browser history |
| Never in logs | Redaction lists for auth headers, cookies, `password`, `token`, `secret`, `key` |
| Never in the frontend bundle | `VITE_*` is public |
| Never shared across environments | A dev leak must not open production |
| Generated randomly, ≥ 32 bytes | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| Scoped to least privilege | R2 token per bucket, object read/write only; DB role per app; CI token per repo with minimal scopes |
| Rotated on schedule and on incident | Design for rotation: secrets read at boot, rollout applies them; dual-accept for signing keys during rotation |
| Access audited | Who can read platform secrets; review quarterly |

## `.env.example`

Committed, complete, placeholders only, with a comment per variable. It
is the contract; `config.ts` validation enforces it.

## Detecting leaks

- `gitleaks` or GitHub secret scanning (push protection) on the repo.
- Pre-commit hook scanning staged files.
- Rotate immediately on any hit; don't rewrite history and consider it fixed.

## Encryption at rest in the database

For data that must be stored but rarely read (TOTP secrets, third-party
tokens): encrypt with a key from the secret store (AES-256-GCM), store
ciphertext + nonce, never the key in the database.

## Related

- [00-engineering-principles/configuration-management.md](../00-engineering-principles/configuration-management.md)
- [18-devops/secrets.md](../18-devops/secrets.md)
