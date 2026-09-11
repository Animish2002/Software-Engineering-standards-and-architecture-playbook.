# Recommended Claude Code skills for this stack

Skills are reusable, invokable procedures (`/skill-name`) that either run
inline in the session or launch a subagent. The ones below are the
built-in/first-party skills that fit a project built from this playbook,
plus where a small custom skill pays for itself. Enable only what the
project will actually use — an unused skill is just noise in the list.

## Built-in skills worth using on every project here

| Skill | When it earns its place | Notes |
| --- | --- | --- |
| `/code-review` | Every non-trivial PR, at least at `medium` effort | Reviews the diff for correctness bugs and reuse/simplification issues — pairs directly with [21-checklists/code-review-checklist.md](../21-checklists/code-review-checklist.md). Use `--fix` to apply findings, `--comment` to post them inline on a GitHub PR. |
| `/code-review ultra` | Before a production release, or for a high-risk change (auth, permissions, schema, payments) | Multi-agent, deeper, billed — worth it specifically for the risk categories in [15-security/security-checklist.md](../15-security/security-checklist.md). |
| `/simplify` | After a feature works but before merging, when the diff feels larger than it should | Reuse/simplification/efficiency pass only — no bug hunting, so pair it with `/code-review` rather than using it alone. |
| `/security-review` | Before production; quarterly after; any PR touching auth/permissions/payments | Complements, doesn't replace, [15-security/security-checklist.md](../15-security/security-checklist.md) — a checklist plus an actual review. |
| `/init` | The very first session in a new (non-empty) codebase | Generates a starting `CLAUDE.md` from the existing code — follow it with a manual pass using [CLAUDE.md.template](CLAUDE.md.template) to add the sections `/init` can't infer (policy decisions, "why," what NOT to do). |
| `run` (project-run skill, if configured) | Whenever the assistant needs to demonstrate a change actually works | Only appropriate for `apps/api` (curl-testing against a locally-run dev server) per this playbook's rule — never for driving `apps/web`'s dev server or a browser. |
| `/loop` | A recurring check that has to happen on an interval (watching a deploy, polling CI) | Not for one-off tasks. |
| `fewer-permission-prompts` | Once a project's read-only command patterns have stabilised (a few weeks in) | Reduces friction without widening what's allowed — it only allowlists patterns already approved repeatedly. |

## Skills to avoid enabling by default

- Anything that drives a browser against `apps/web` for verification — this playbook's explicit rule is that the human verifies the UI; an assistant should stop at `build:web`/`lint:web`/`typecheck`.
- General "autonomous" long-running loops on a codebase without a specific, bounded task — prefer a scoped `/loop` invocation over an open-ended one.

## Writing a project-specific skill

Worth doing once a procedure is repeated identically across sessions and
has more than 2-3 steps that are easy to get subtly wrong. See
[custom-skills/README.md](custom-skills/README.md) for the shape and three
concrete examples for this stack (module scaffolder, migration-safety
checker, component-catalog reminder).

## Keeping this list current

When a new skill genuinely changes how the project is worked on, add a
row here in the same PR — same discipline as README.md/CHANGELOG.md
elsewhere in this repository.
