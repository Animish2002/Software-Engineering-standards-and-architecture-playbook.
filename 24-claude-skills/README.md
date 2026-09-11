# 24 — Claude Code skills

How to set up a new project so Claude Code (or any AI coding assistant
that reads project-level instructions) follows the standards in this
repository instead of inventing its own conventions per session.

| Document | Contents |
| --- | --- |
| [CLAUDE.md.template](CLAUDE.md.template) | A starting `CLAUDE.md` for a new project — copy it in and fill the brackets. |
| [recommended-skills.md](recommended-skills.md) | Which built-in and custom Claude Code skills to enable for this stack, and why. |
| [custom-skills/](custom-skills/README.md) | Project-specific skill definitions worth writing once and reusing: a new-module scaffolder, a migration-safety checker, a component-catalog reminder. |

## Why this section exists

An AI assistant without project context re-derives conventions every
session: sometimes it picks feature folders, sometimes type folders;
sometimes cursor pagination, sometimes offset; sometimes it reaches for
Redux for one boolean. A `CLAUDE.md` at the repo root — read automatically
at the start of every session — removes that variance by pointing
straight at the decisions already made in this playbook.

## The two things every project needs

1. **A `CLAUDE.md`** stating the stack, the architecture, the conventions,
   and — critically — pointers into this playbook's decision guides so
   the assistant reasons from the same defaults a human engineer would.
2. **A short list of enabled skills** (see
   [recommended-skills.md](recommended-skills.md)) so routine work (code
   review, running the app, checking for regressions) goes through a
   consistent, repeatable procedure rather than being re-invented per
   session.

Keep both under the same update discipline as the rest of this repo:
when a real decision changes, update `CLAUDE.md` in the same PR.
