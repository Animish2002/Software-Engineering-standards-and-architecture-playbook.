# Examples

Small, complete, end-to-end examples that show several documents in this
playbook working together on one concrete feature, rather than one rule
in isolation. Read the linked standards for the *why*; read these for the
*all the pieces at once*.

| Folder | Shows |
| --- | --- |
| [backend/](backend/README.md) | One feature (file upload with quota) through routes → controller → service → repository → error handling → audit. |
| [database/](database/README.md) | The reference schema from [03-databases/schema-design.md](../03-databases/schema-design.md) as a runnable Drizzle package excerpt, plus one query optimised end to end. |
| [frontend/](frontend/README.md) | One feature (a paginated, filterable table with a confirm-delete flow) built from the component catalog. |
| [api/](api/README.md) | One endpoint's full contract: request schema, response envelope, error cases, and its API test file. |
| [fullstack/](fullstack/README.md) | The same feature (share a file with another user) traced from the database row to the UI, across every layer. |

These are illustrations, not a second copy of the standards — each file
is short and links back to the document that explains the rule it's
demonstrating. When a rule changes, update the standard first; update the
example only if it would otherwise contradict the standard.
