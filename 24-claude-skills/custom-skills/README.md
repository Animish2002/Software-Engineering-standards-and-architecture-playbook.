# Custom project skills

A custom skill is a Markdown file under `.claude/skills/<name>/SKILL.md`
in the project repository (not this playbook repository) that Claude Code
loads and can invoke with `/<name>`. Write one when a procedure is:

- repeated identically across sessions,
- more than 2-3 steps, and
- easy to get subtly wrong without the checklist in front of you.

Don't write one for a single-step task ("run the linter") — that's just a
command, not a skill.

## Shape of a `SKILL.md`

```markdown
---
name: new-module
description: Scaffold a new backend feature module following this project's layering (routes/controller/service/repository/schema/index.ts).
---

# New module scaffolder

1. Ask for the module name (kebab-case) and a one-line description of what it owns.
2. Create `apps/api/src/modules/<name>/` with:
   - `<name>.routes.ts`
   - `<name>.controller.ts`
   - `<name>.service.ts`
   - `<name>.repository.ts`
   - `<name>.types.ts` (or import shapes from packages/shared-types)
   - `index.ts` exporting the router and the service functions other modules may call — never the repository
3. Register the router in `apps/api/src/routes.ts` WITH its prefix, before any unprefixed router.
4. If the module needs a table, add it to `packages/db/src/schema/<name>.ts` and remind the user to run `npm run db:generate -- --name=add_<name>`.
5. Add a stub permission key if the module needs one, and remind the user to add it to `ROLE_PERMISSION_KEYS` in the seed.
```

## Three worth writing for a project from this playbook

### `new-module` (backend scaffolder)

As shown above. Encodes
[02-backend/code-organization.md](../../02-backend/code-organization.md)
and the router-mounting rule from
[07-express/production-structure.md](../../07-express/production-structure.md)
so a new module can never accidentally shadow public routes.

### `migration-check` (migration safety reviewer)

```markdown
---
name: migration-check
description: Review a newly generated Drizzle migration for production safety before it's applied.
---

# Migration safety check

1. Read the generated .sql file under packages/db/drizzle/.
2. Flag, per 03-databases/migrations.md:
   - CREATE INDEX without CONCURRENTLY on a table likely to have production rows
   - ADD CONSTRAINT ... CHECK or FOREIGN KEY without NOT VALID + a separate VALIDATE step
   - ADD COLUMN ... NOT NULL with no DEFAULT on a non-empty table
   - Any DROP COLUMN / DROP TABLE not preceded by a prior deploy that stopped using it (expand/contract)
3. Confirm every new index is added to EXPECTED_INDEXES in the db:check script.
4. Report findings; do not apply the migration without confirmation.
```

### `component-check` (reuse reminder before adding UI)

```markdown
---
name: component-check
description: Before writing a new dialog/table/empty-state/form in a feature, check whether an existing shared component in components/common or components/ui already covers it.
---

# Component catalog check

1. Grep components/common and components/ui for existing primitives matching what's about to be built (dialog, table, empty state, form field, confirm flow).
2. If one exists: use it, composed per 10-frontend/components/composition.md — do not fork or restyle it inline.
3. If none exists and this is the 3rd occurrence of the same pattern: propose extracting it into components/common per 10-frontend/components/catalog.md, not into the feature folder.
4. If this is the 1st or 2nd occurrence: build it locally in the feature folder — do not pre-extract.
```

## Where to put these

`.claude/skills/<name>/SKILL.md` in the **project's own repository**, not
in this playbook. This playbook is the reference; the project repo is
where the skill actually runs.
