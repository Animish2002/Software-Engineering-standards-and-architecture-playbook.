# Frontend checklist (per feature / PR)

## Structure

- [ ] Code in `features/<feature>/` (components, hooks, api, types, `index.ts`); shared UI in `components/common|ui|forms`.
- [ ] Pages compose; no fetching or business logic in pages or components.
- [ ] No `fetch` outside `lib/http.ts`; API functions typed with shared types.
- [ ] Types from `@app/shared-types`; schemas from `@app/validation`.

## Data and state

- [ ] Server data through the cache layer; `isLoading` → skeleton, `isRevalidating` → progress bar.
- [ ] Mutations mark stale (not invalidate) and refetch in the background.
- [ ] URL holds shareable state (folder, page, filters, sort).
- [ ] No server data copied into `useState`; no effect-based state syncing.
- [ ] Effects have correct deps; function props stored in refs when used in effects.

## UI

- [ ] Uses catalog components: `PageHeader`, `LoadingState`, `ErrorState`, `EmptyState`, `ConfirmDialog`, form fields.
- [ ] No new "universal" component; no `mode` props; primitives composed per page.
- [ ] Visual variants via `cva`; semantic tokens only; no raw palette colours; no `dark:` for colours.
- [ ] Responsive at 400 / 768 / 1024 / 1440; `min-w-0` on truncating flex children; no horizontal page scroll.
- [ ] Touch: no hover-only affordances; targets ≥ 44 px.
- [ ] No native dialogs (`alert`/`confirm`/`prompt`/`webkitdirectory`/extra `beforeunload`).

## Forms

- [ ] react-hook-form + shared Zod schema + field wrappers.
- [ ] Server `VALIDATION_FAILED` mapped to fields; non-field errors toasted.
- [ ] Submit disabled while pending; dialog forms reset on close.

## Accessibility

- [ ] Keyboard-operable; visible focus; labels on inputs; `aria-label` on icon buttons; `alt` on images.
- [ ] Contrast checked in both themes.

## Performance

- [ ] Route lazy-loaded; heavy libs lazy; per-item work gated on visibility.
- [ ] Lists > 200 rows virtualised or capped.
- [ ] Images/videos sized and lazy.

## Security

- [ ] Access token in memory; no tokens in storage.
- [ ] No `dangerouslySetInnerHTML` without sanitiser; URL schemes validated.
- [ ] Permission-gated UI backed by API enforcement.

## Tests and build

- [ ] Unit tests for logic/hooks; component tests for shared components.
- [ ] `npm run build:web`, `lint`, `typecheck` pass. (No dev server / browser automation to "verify".)

## Related

- [10-frontend/README.md](../10-frontend/README.md)
