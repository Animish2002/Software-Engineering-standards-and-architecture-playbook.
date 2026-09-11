# Branching strategy

## Trunk-based with short-lived branches (recommended)

```text
main ──●──●──●──●──●──●──●──●──►  always deployable; deploys to staging on push
        \    /     \      /
   feat/x ●─●   fix/y ●──●        branches live hours to a few days, merged by PR
                                  tags v1.4.0 → production
```

- `main` is protected and always green.
- Branch per task; merge within days; delete after merge.
- Incomplete features ship behind a flag or aren't wired to the UI yet, rather than living on a long branch.
- Production is a tag (or a manual promotion of a staging build), not a separate long-lived branch.

## Why not Git Flow

`develop`/`release`/`hotfix` branches add merge overhead and drift for
teams that deploy continuously. Use it only if you ship versioned
releases to customers who install them.

## Branch naming

```text
<type>/<short-kebab-description>
feat/share-dialog-multiselect
fix/logout-ends-session
perf/index-hot-columns
chore/bump-node-22
docs/deployment-railway
```

Optionally with an issue number: `feat/123-share-dialog`.

## Hotfixes

Branch from `main`, PR, merge, tag. Same flow, faster review. If
production is on an older tag and `main` has unreleased risky changes,
branch from the tag, fix, tag `v1.4.1`, then merge the fix forward into
`main`.

## Keeping branches fresh

`git rebase main` daily on your own branch; resolve conflicts early. Merge
queue (GitHub) on busy repos to keep `main` green under concurrent merges.

## Related

- [git.md](git.md)
- [pull-requests.md](pull-requests.md)
- [environments.md](environments.md)
