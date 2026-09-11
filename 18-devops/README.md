# 18 — DevOps

Git, GitHub, CI/CD, environments, and deployment discipline for a small
team shipping the stacks in this playbook.

| Document | Answers |
| --- | --- |
| [git.md](git.md) | Repository layout, commits, history hygiene, merge vs rebase. |
| [github.md](github.md) | Repository settings, protections, templates, releases. |
| [branching-strategy.md](branching-strategy.md) | Trunk-based with short-lived branches; naming. |
| [pull-requests.md](pull-requests.md) | Size, description, review flow, merging. |
| [ci-cd.md](ci-cd.md) | The pipeline, per deployment target. |
| [environments.md](environments.md) | Local, test, preview, staging, production. |
| [secrets.md](secrets.md) | Secrets in CI and platforms. |
| [deployment-checklist.md](deployment-checklist.md) | Before and after every deploy. |

## The default setup

```text
GitHub repo (monorepo) → branch protection on main → PR with CI (lint, typecheck, tests, build)
   → merge → deploy to staging automatically → tag/release → deploy to production
Frontend: Cloudflare Pages   API: Railway (or Workers)   DB: managed Postgres   Files: R2
```
