# GitHub

## Repository settings

| Setting | Value |
| --- | --- |
| Default branch | `main` |
| Branch protection / ruleset on `main` | Require PR; require status checks (lint, typecheck, test, build); require up-to-date branch or merge queue; no force push; no deletion; linear history |
| Merge options | Squash (default), rebase; disable merge commits |
| Auto-delete head branches | On |
| Secret scanning + push protection | On |
| Dependabot security updates + version updates (weekly, grouped) | On |
| Actions permissions | Allow verified/pinned actions; `GITHUB_TOKEN` read-only by default, elevate per job |
| Environments | `staging`, `production` with required reviewers on production and environment-scoped secrets |
| Code owners | `CODEOWNERS` for `packages/db` (schema), `.github/`, security-sensitive modules |

## Files under `.github/`

```text
.github/
├── workflows/
│   ├── ci.yml              lint, typecheck, unit, integration/API, build
│   ├── deploy-staging.yml  on push to main
│   └── deploy-prod.yml     on tag v*
├── PULL_REQUEST_TEMPLATE.md
├── CODEOWNERS
└── dependabot.yml
```

### PR template

```markdown
## What
<one paragraph: the change and why>

## How to verify
- [ ] steps / test names

## Checklist
- [ ] Tests added/updated
- [ ] Migration reviewed (if schema changed) and `EXPECTED_INDEXES` updated
- [ ] README/CHANGELOG/CLAUDE.md updated if endpoints, permissions, schema, or known gaps changed
- [ ] No secrets, no `console.log`, no native dialogs
```

### dependabot.yml

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      dev-tooling: { patterns: ["eslint*", "prettier*", "typescript", "vitest", "@types/*"] }
      runtime-minor: { update-types: ["minor", "patch"] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

## Issues and projects

- Issues for bugs/features with a template asking for reproduction/acceptance criteria.
- Labels: `bug`, `feature`, `security`, `perf`, `docs`, `good first issue`.
- A project board only if the team is > 2; otherwise the issue list is enough.

## Releases

- Tag `vX.Y.Z` → GitHub Release with the CHANGELOG section as notes (automate with `softprops/action-gh-release` or Release Drafter).

## Related

- [pull-requests.md](pull-requests.md)
- [ci-cd.md](ci-cd.md)
