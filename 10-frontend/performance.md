# Frontend performance

Measure first: Lighthouse, the Performance panel, React DevTools Profiler,
`vite build` chunk sizes. Then fix the biggest thing.

## Network (usually the biggest)

| Problem | Fix |
| --- | --- |
| Waterfall of requests per page (list, then per-item detail) | One screen-shaped endpoint; batch endpoints (`preview-urls`) |
| Refetch on every navigation | Cache with revalidation; module-level so "back" is instant |
| Large initial bundle | Lazy routes; lazy heavy libraries; check `manualChunks` |
| Uncompressed assets | Host/CDN compresses; hashed filenames with long cache |
| Large images | Right-sized thumbnails from storage; `loading="lazy"`; `decoding="async"`; `<video preload="metadata">` |
| Per-card work (PDF thumbnails) | `IntersectionObserver` gate; memoise by URL; lazy-load the renderer |

## Rendering

| Problem | Fix |
| --- | --- |
| Whole tree re-renders on every keystroke | Keep input state local; lift only what's shared; split contexts |
| Expensive derived values recomputed | `useMemo` **after** profiling shows it matters |
| Child re-renders because of new callback identity | `useCallback` only when the child is memoised and measurably heavy; React 19's compiler can remove much of this |
| Long lists (≥ 200 rows) | Virtualise (`@tanstack/react-virtual`) or paginate; cap DOM nodes (e.g., show 200 rows + "N more") |
| Layout thrash from measuring in effects | `useLayoutEffect` sparingly; CSS-driven layout; `ResizeObserver` |
| Effects that refetch in a loop (inline resolver props) | Store the function in a ref; stable dependencies |

Don't wrap everything in `memo`/`useMemo`/`useCallback` by default. It adds
cost and noise; use it where the profiler shows a win.

## Perceived performance

- Skeletons that match the final layout; no spinner-then-jump.
- Never flash a skeleton over existing data (revalidate quietly).
- Optimistic updates for cheap, reversible actions (star/unstar).
- Prefetch on hover for likely navigations (folder cards) when the cache layer supports it.

## Bundle hygiene

- No moment.js (use `date-fns` or `Intl`); no lodash (native methods); icons imported individually (`lucide-react` tree-shakes).
- Analyse with `rollup-plugin-visualizer` before adding a dependency over ~50 KB.

## Web Vitals targets

LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on a mid-range phone over 4G. Check
with Lighthouse in CI or the Chrome UX report if the site is public.

## Related

- [vite.md](vite.md)
- [17-performance/frontend.md](../17-performance/frontend.md)
- [react/rendering.md](react/rendering.md)
