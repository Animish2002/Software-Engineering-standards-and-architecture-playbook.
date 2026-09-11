# Layouts

## What is it?

The shared chrome around pages: header, sidebar, container, footer.
Implemented once as **layout routes** with an `<Outlet />`, never copied
into each page.

## Recommended approach

```tsx
// app/layouts/AppLayout.tsx
export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />          {/* includes GlobalProgressBar */}
        <main className="flex-1 min-w-0 p-4 md:p-6"><Outlet /></main>
      </div>
      <UploadProgressPanel />
    </div>
  );
}

// app/router.tsx
<Route element={<RequireAuth />}>
  <Route element={<AppLayout />}>
    <Route path="/drive/:folderId?" element={<DrivePage />} />
    <Route element={<RequirePermission permission="user:manage" />}>
      <Route path="/users" element={<UsersPage />} />
    </Route>
  </Route>
</Route>
<Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
</Route>
```

## Page-level structure

Every page uses the same skeleton so spacing and headers are consistent:

```tsx
<PageHeader title="Users" description="Manage accounts" actions={<Button onClick={openCreate}>New user</Button>} />
<PageContent>…</PageContent>
```

`PageHeader` is a `components/common` component; pages pass content, not
layout classes.

## Responsive rules

- The sidebar collapses to a sheet/drawer under `md`; the header stays.
- `min-w-0` on flex children that contain truncating text, or the layout won't shrink.
- Toolbars beside variable-width content (breadcrumbs) are `shrink-0`; the variable part is `flex-1 min-w-0` and collapses (overflow menu) rather than scrolls.
- Fixed panels (upload tray) are full-width above the bottom edge on mobile, bottom-right on desktop.

## Don't

- Copy header/sidebar markup into pages.
- Put data fetching in layouts beyond what the chrome itself needs (current user, unread count).
- Nest layouts more than two deep.

## Related

- [routing.md](routing.md)
- [components/README.md](components/README.md)
