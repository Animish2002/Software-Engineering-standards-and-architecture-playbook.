# Git

## Repository layout

One repository per product (monorepo with `apps/*` and `packages/*`).
Separate repos only for genuinely independent products or open-source
libraries.

```text
.
├── .github/            workflows, PR template, CODEOWNERS
├── apps/
├── packages/
├── docs/               DEPLOYMENT.md, LOCAL-SETUP.md, decisions/
├── tests/              cross-app API tests
├── .env.example
├── .gitignore
├── .editorconfig
├── CLAUDE.md           (see 24-claude-skills)
├── README.md
├── CHANGELOG.md
└── package.json
```

## Commits

**Conventional Commits**, imperative mood, scoped to the module:

```text
feat(shares): enforce edit permission on shared folders
fix(auth): make logging out actually end the session
perf(items): walk folder trees in Postgres instead of JavaScript
refactor(web): extract ConfirmDialog from three pages
docs: add deployment steps for Railway
chore(deps): bump drizzle-orm to 0.44
test(api): add tenancy cases for share endpoints
```

- Subject ≤ 72 chars; body explains **why** when the diff doesn't.
- One logical change per commit; squash fixups before merge.
- `BREAKING CHANGE:` footer or `!` for API/schema breaks.
- Reference issues (`Closes #42`).

## `.gitignore`

Node, build output, env files, editor noise, OS files, coverage,
`.wrangler`, `.dev.vars`. Commit `.env.example` and `.dev.vars.example`.
Never commit lockfile-less installs; always commit `package-lock.json`.

## Merge vs rebase

| Situation | Do |
| --- | --- |
| Updating your branch with `main` | `git rebase main` (linear, no merge bubbles) if the branch is yours; `git merge main` if shared |
| Merging a PR | **Squash and merge** (one clean commit per PR, message from the PR title) for most PRs; "rebase and merge" when the branch's commits are individually meaningful |
| Never | Force-push to `main`; rewrite published history others depend on |

## History hygiene

- `git commit --fixup` + `git rebase -i --autosquash` before opening the PR (interactive rebase is local; fine).
- Don't commit generated files except lockfiles and migration snapshots.
- Large binaries: don't. Object storage or Git LFS if unavoidable.

## Tags and releases

- `vMAJOR.MINOR.PATCH` annotated tags on `main` for production deploys.
- `CHANGELOG.md` updated in the same PR as the change (newest first).

## Useful config

```bash
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global rebase.autosquash true
git config --global push.autoSetupRemote true
```

## Related

- [branching-strategy.md](branching-strategy.md)
- [pull-requests.md](pull-requests.md)
