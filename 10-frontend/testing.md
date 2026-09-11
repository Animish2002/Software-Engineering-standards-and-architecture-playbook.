# Frontend testing

Strategy across the stack: [16-testing/testing-strategy.md](../16-testing/testing-strategy.md).
Detail for the frontend: [16-testing/frontend-testing.md](../16-testing/frontend-testing.md).

## What to test in a React app, in priority order

1. **Pure logic**: `hasPermission`, formatters, cursor encoding, folder-drop readers, upload orchestration. Vitest unit tests. Cheap, fast, high value.
2. **Hooks with API interaction**: `useDriveView`, `useUpload` with the HTTP layer mocked (MSW or a mocked `lib/http`). Assert loading/revalidating/error transitions.
3. **Shared components' behaviour**: `DataTable` sorting/pagination, `ConfirmDialog` calling `onConfirm`, forms showing server errors. React Testing Library, user-event.
4. **Critical flows end-to-end** (optional tier): login, upload, share. Playwright against a deployed preview. Few, stable, slow. Only when the product warrants it and the team can maintain them.

## What not to test

- shadcn primitives (already tested upstream).
- Snapshot tests of large trees (brittle, low signal).
- Implementation details (state variable names, internal calls).

## Tools

- **Vitest** + **jsdom** + **@testing-library/react** + **@testing-library/user-event**.
- **MSW** to mock the API at the network level, using the same envelope.
- **eslint-plugin-testing-library** for hygiene.

## Note on this playbook's constraint

When working with Claude Code on a project, the rule is: don't launch the
Vite dev server or drive the browser to "verify" UI changes. Stop at
`build`, `lint`, `typecheck`, and unit tests; the human verifies the UI.
See [24-claude-skills/](../24-claude-skills/README.md).

## Related

- [16-testing/frontend-testing.md](../16-testing/frontend-testing.md)
