# Deployment checklist

## Before

- [ ] CI green on the commit being deployed.
- [ ] Migration reviewed; backwards compatible with the currently running code (expand/contract).
- [ ] `EXPECTED_INDEXES`/`db:check` updated for new indexes.
- [ ] Config changes applied to the target environment **before** the deploy (new env vars set).
- [ ] Reference-data seed (`seed:rbac`) planned if permissions changed.
- [ ] CHANGELOG entry present; tag prepared for production.
- [ ] Rollback path known (previous image/commit; migration is forward-compatible).
- [ ] Deploy window sensible (not before leaving for the day).

## During

- [ ] Migrate → deploy → health (in that order), per the pipeline.
- [ ] Watch logs during rollout for errors/restarts.

## After

- [ ] `/health` 200; `/health/system` reports `ok` (DB latency, indexes present, storage reachable).
- [ ] `db:check` shows all migrations applied, no missing indexes.
- [ ] Smoke test: login, primary read, primary write, upload/download.
- [ ] Error rate and p95 unchanged or better over the next 15 minutes.
- [ ] Old build removed / previous version retained for rollback.
- [ ] Announce (changelog link) if users notice.

## Related

- [ci-cd.md](ci-cd.md)
- [21-checklists/production-checklist.md](../21-checklists/production-checklist.md)
