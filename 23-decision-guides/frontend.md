# Frontend decisions

## Local state vs global state

```text
Does the value come from the server? ───────────────────► It's not "state" at all — use the server-data cache layer
                                                             (see ../10-frontend/state-management.md), never useState + useEffect

Should it survive a page refresh / be shareable via URL? ─► URL search params / route params

Used by one component and maybe its direct children? ────► useState in that component; pass down as props

Used by unrelated parts of the tree, AND changes often
or from outside React (sockets, upload progress)? ────────► A small store (Zustand), selecting slices

Used by unrelated parts of the tree, but changes rarely
(current user, theme)? ────────────────────────────────────► React Context
```

Full tree with examples: [../10-frontend/state-management.md](../10-frontend/state-management.md).

## Context vs external state management (Zustand/Redux/etc.)

```text
Does the value change frequently (many times per second,
or from an event source outside React like a WebSocket)?
  │
  ├── Yes ─────────────────────────────────────────────► A store (Zustand), with selectors so only
  │                                                        subscribed components re-render
  │
  └── No — changes are rare (login/logout, theme toggle)
       │
       └── Context is fine — the "every consumer re-renders"
           cost of Context only matters when updates are frequent
```

Never reach for Redux/MobX/a heavy state library by default. Most apps in
this playbook need: the server-data cache (handles the majority of
"global" state), Context for auth/theme, and at most one small Zustand
store for something genuinely cross-cutting and frequently changing (an
upload queue). See [../10-frontend/state-management.md](../10-frontend/state-management.md).

## Component vs hook

```text
Does it render UI (JSX)? ────────────────────────────────► Component
Does it manage state/effects/subscriptions but render
  nothing itself? ─────────────────────────────────────────► Hook (useX)
Is it stateless and has no React lifecycle involvement
  at all (pure data transform)? ─────────────────────────────► Plain function in lib/, not a hook
```

A common smell: a "container component" whose entire body is
`const data = useSomething(); return <Presentational {...data} />`.
That's a hook wearing a component costume — extract the hook, let the
page compose `usePresentationalData()` + `<Presentational>` directly, or
keep the container only if it also renders meaningful markup (loading/
error/empty branching). See
[../10-frontend/react/hooks.md](../10-frontend/react/hooks.md).

## REST vs other API approaches

```text
Single first-party TypeScript frontend + backend, no third-party
API consumers, want end-to-end types with zero codegen? ──► RPC-style typed routes (Hono's hc client) — still keep
                                                              the same envelope/status/error discipline as REST
Public API, multiple/unknown clients, need caching by URL,
  or a stable versioned contract? ─────────────────────────► REST + JSON (the default for this playbook)
Many clients with very different data-shape needs, and the
  team can afford resolver complexity + auth-per-field? ────► GraphQL — rare fit; most projects here don't need it
Real push (chat, live cursors, presence)? ─────────────────► WebSockets/SSE for that feature only; REST/RPC for the rest
```

Full detail: [../05-apis/rest-api-design.md](../05-apis/rest-api-design.md#alternatives-and-when).

## Related

- [../10-frontend/state-management.md](../10-frontend/state-management.md)
- [../10-frontend/components/when-not-to-reuse.md](../10-frontend/components/when-not-to-reuse.md)
