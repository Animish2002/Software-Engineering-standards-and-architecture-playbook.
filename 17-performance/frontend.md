# Frontend performance (playbook)

Detail: [10-frontend/performance.md](../10-frontend/performance.md).

## 1. Network first

- Lazy routes; heavy libraries lazy at the call site.
- One screen-shaped API call per page; batched derived data.
- Client cache with revalidation; instant back navigation.
- Hashed assets with long cache; SPA shell small.
- Images/videos sized for display; lazy; `preload="metadata"` for video; thumbnails gated on visibility.

## 2. Bundle

- Analyse; drop moment/lodash-style deps; tree-shakeable icon imports.
- Target < 250 KB gzipped for the shell.

## 3. Rendering

- Keep fast state local; split contexts; selectors on stores.
- Memoise after profiling, not before (React Compiler if enabled).
- Virtualise or cap long lists; `+N more` summaries.
- Stable effect deps; resolver functions in refs.

## 4. Perceived

- Skeletons shaped like content; never over existing data.
- Optimistic updates for cheap reversible actions.
- Prefetch on hover for likely navigations.

## 5. Measure

Lighthouse on key pages (mobile profile); `web-vitals` reporting in
production; React Profiler for interaction jank.

## Checklist

- [ ] Every top-level route lazy.
- [ ] No page needs > 2 API calls to first render.
- [ ] Lists > 200 rows virtualised or capped.
- [ ] Images/videos sized and lazy.
- [ ] Bundle analysed; no oversized deps.
- [ ] LCP/INP/CLS within budget on mobile.

## Related

- [10-frontend/performance.md](../10-frontend/performance.md)
- [10-frontend/vite.md](../10-frontend/vite.md)
