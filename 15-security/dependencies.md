# Dependency security (supply chain)

## Controls

| Control | How |
| --- | --- |
| Lockfile committed; `npm ci` in CI and Docker | Reproducible installs; no silent upgrades |
| `npm audit --audit-level=high` in CI | Fails the build on known highs; document accepted exceptions with an expiry |
| Automated updates (Dependabot/Renovate), weekly, grouped | Small, reviewable bumps; security updates prioritised |
| Review new dependencies | Maintenance, size, transitive deps, license, install scripts (`npm view <pkg>`) |
| Minimal dependency count | Prefer platform APIs; each package is code you run with full privileges |
| Pin GitHub Actions to a SHA or a major tag from trusted publishers | Actions are dependencies too |
| `ignore-scripts` for untrusted installs where feasible; review `postinstall` of new packages | Install scripts run arbitrary code |
| Provenance/signatures (`npm audit signatures`) | Detect tampered packages |
| Separate CI tokens with least scope; no long-lived npm publish tokens in CI | Limit blast radius |
| Image scanning (Trivy/Scout) | OS-level CVEs in base images |
| Frontend: review what a UI package pulls in; audit CDN scripts (avoid them) | XSS via third-party code |

## Update policy

- Security patches: within days.
- Minor/patch: weekly batch.
- Majors: scheduled, one at a time, with changelog review and tests.
- Dev tooling: kept current; runtime deps: deliberate.

## Responding to a vulnerable dependency

1. Check whether the vulnerable code path is reachable (`npm ls <pkg>`, read the advisory).
2. Update or override (`overrides` in `package.json` for transitive deps).
3. If no fix exists: replace the package, or document the accepted risk with a date to revisit.

## Related

- [01-project-architecture/dependency-management.md](../01-project-architecture/dependency-management.md)
- [18-devops/ci-cd.md](../18-devops/ci-cd.md)
