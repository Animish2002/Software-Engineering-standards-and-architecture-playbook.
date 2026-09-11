# Monolith vs modular monolith vs microservices

## The tree

```text
Do you have more than ~8 engineers, or multiple teams that need to
deploy independently without coordinating?
  │
  ├── No ──────────────────────────────────────────► Monolith
  │                                                    (feature folders, layered inside; see 01-project-architecture/monolith.md)
  │
  └── Yes
       │
       Is there ALSO a specific module with a proven, measured need
       for independent scaling, a different runtime, or hard isolation?
       │
       ├── No ─────────────────────────────────────► Modular monolith
       │                                              (enforced module boundaries + lint; 01-project-architecture/modular-monolith.md)
       │
       └── Yes ────────────────────────────────────► Modular monolith,
                                                        + extract ONLY that one module as a service
                                                        (01-project-architecture/microservices.md)
```

## Why the default is a monolith

Every cost of microservices — network calls where function calls used to
be, distributed transactions, per-service CI/CD, cross-service
observability, versioned contracts — is paid whether or not the team
needs the benefit. The benefit (independent scaling, independent
deploys, team autonomy) only materialises at a scale most projects never
reach. A monolith with clean module boundaries can become microservices
later; the reverse migration (merging services back) almost never
happens because nobody budgets time for it.

## Signals, not vibes

| Signal | Weight |
| --- | --- |
| "We might need to scale one day" | Ignore — a monolith on 2-3 instances scales further than most products need |
| "Microservices are the industry standard" | Ignore — most successful products you've used are monoliths or modular monoliths for years past their current traffic |
| Two teams keep blocking each other on deploys of the same repo | Real signal → modular monolith first; extract only if boundaries are already clean and the blocking continues |
| One workload has a measured, different scaling profile (video processing next to a CRUD API) | Real signal → extract that one workload |
| A regulator requires data isolation between two parts of the system | Real signal → separate services with separate databases for those parts |
| "We want to use a different language for X" | Weak signal — usually solvable with a worker/job inside the monolith; only real if X is a mature ecosystem gap (e.g., ML inference) |

## What to do instead of splitting early

1. Feature folders with layers inside ([01-project-architecture/feature-based-architecture.md](../01-project-architecture/feature-based-architecture.md)).
2. Enforce module boundaries with a lint rule once the codebase justifies it ([01-project-architecture/modular-monolith.md](../01-project-architecture/modular-monolith.md)).
3. Scale the monolith: indexes, caching, more instances, read replicas, background jobs ([01-project-architecture/monolith.md](../01-project-architecture/monolith.md#scaling-a-monolith-before-splitting-it)).

## Related

- [../01-project-architecture/choosing-an-architecture.md](../01-project-architecture/choosing-an-architecture.md)
- [../01-project-architecture/microservices.md](../01-project-architecture/microservices.md)
