# Vite

## Config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { port: 5173, strictPort: true },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          // heavy optional libs get their own chunk so they're only fetched when a lazy route needs them
        },
      },
    },
  },
});
```

`tsconfig.json` needs the matching `paths` (`"@/*": ["./src/*"]`).

## Environment variables

- Only `VITE_*` variables are exposed, at **build time**, inlined into the bundle. They are public.
- `import.meta.env.VITE_API_URL`; type them in `src/vite-env.d.ts`:

```ts
interface ImportMetaEnv { readonly VITE_API_URL: string; }
```

- Validate at startup with a tiny Zod schema so a missing variable fails loudly in development and in the build.
- `.env.local` (ignored) for local values; `.env.example` committed; production values set in the hosting platform's build settings.

## Code splitting

```tsx
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
<Route path="/users" element={<Suspense fallback={<PageSkeleton />}><UsersPage /></Suspense>} />
```

- Lazy-load every top-level route.
- Lazy-load heavy libraries at the call site (`await import('pdfjs-dist')`) and gate the work on visibility (`IntersectionObserver`) when it's per-item.
- Check the result: `npx vite build` prints chunk sizes; `rollup-plugin-visualizer` for a treemap.

## Dev server

- Proxy is unnecessary when the API sets CORS for the dev origin; use it only to avoid CORS entirely: `server.proxy: { '/api': 'http://localhost:4000' }`.
- HMR works for components; state in modules (caches) survives edits unless the module itself changes.

## Build output

- `dist/` with hashed assets; `index.html` referencing them.
- Serve with long cache headers for `/assets/*`, short for `index.html` (Pages does this).
- SPA fallback (`/* → /index.html`) for client-side routing.

## Static assets

- `public/` for files served as-is at the root (`favicon`, `_headers`, `robots.txt`).
- `src/assets/` for imported assets that get hashed and optimised.

## Related

- [performance.md](performance.md)
- [09-cloudflare/deployment.md](../09-cloudflare/deployment.md)
