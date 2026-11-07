# FR-04B — Dynamic Sidebar from authenticated current-user navigation

> Status: Angular implementation / PR CI gate, 2026-11-07. Backend companion [FR-04A PR #42](https://github.com/sholehamed/foundation-backend/pull/42), API contract `docs/architecture/current-user-navigation.md`.

## Behavior

- Sidebar now calls `GET {environment.apiUrl}/system/Menus/me` **once on init**; it does not fetch/select a role ID. The backend aggregates all active scoped roles, groups and user denials and returns ordered categories with recursive `childs`.
- Removed `getRoles`, `getMenuByRole`, role dropdown, `systemFallbackMenu()` and the extra hardcoded Access Management links from the Sidebar. This is intentional: an empty or failed API response **must never substitute hardcoded privileged links**.
- Empty 200 response shows a neutral `منویی برای حساب شما تعریف نشده است` message. Failure shows an error and manual retry; existing links are cleared and token/session errors continue to be handled by existing interceptor. Requests are unsubscribed on component destruction.
- Deeply nested routes are rendered by a recursive Angular `ngTemplateOutlet` inside `SidebarMenuItemComponent`. Internal links use RouterLink; HTTPS external links from the backend use `target="_blank"` and `rel="noopener noreferrer"`. Non-clickable parents become expansion containers; parent items with a route keep a link inside the panel. The System logo navigates to `/system/dashboard`, not tenant `/dashboard`.
- System layout still has optional branding and keeps its default image when no tenant context exists; this refactor does not rename/retheme the app or change BFF/Auth transport.

## Deployment and security gates

1. Deploy backend FR-04A before or atomically with this frontend. Older backends don't expose `Menus/me` and will show an error state (not admin links).
2. The persisted menu catalog is **not automatically seeded**. An empty menu is expected on installations without configured active MenuCategories, Menu records and eligible PermissionId grants. Use the existing System Administration menu editor (direct URL `/system/menu-management` for authorized admins) to configure records.
3. Displaying/hiding a menu is **not** authorization. Angular routes are still source-owned; a malicious user can type a URL, but protected APIs must enforce the live server authorization. Frontend permission guards / stable feature manifest remain future work.
4. Menu has no explicit System/Tenant Scope yet; backend FR-04A restricts the `/system/` namespace and validates owner scope. This does not implement TenantPermissionRestriction/Branch/Own/Child semantics.
5. This commit does not touch legacy Password Grant, localStorage, bearer interceptor, BFF feature flags or CSRF/cookie logic. BFF cutover follows its own security and browser certification gates.

## Verification

- Sidebar unit cases: null logo; no role lookup; only API items; empty/error/retry remain fail-closed; logo cleanup.
- Service unit: new `Menus/me` request has **no roleId or tenantId** query parameters.
- Recursive component: grandchild route link and safe external link behavior.
- CI: `npm run test:unit` and `npm run build -- --configuration development` before merge.
- Real browser end-to-end with populated SQL Server catalog (System + Tenant + revocation/deny), route manifest validation and production data inventory remain separate planned tasks.
