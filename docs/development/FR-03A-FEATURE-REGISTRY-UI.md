# FR-03A — Angular code-owned System feature manifest and registry review UI

> Status: implementation / CI verification 2026-11-07. Companion Backend [FR-02A PR #43](https://github.com/sholehamed/foundation-backend/pull/43) defines the authoritative catalog and admin endpoints.

## What is implemented

- `system-feature.manifest.ts` declares **two** stable code-owned keys: `system.roles` and `system.permissions`, with their Angular URL, route segment and view permission code. `system.routes.ts` consumes that constant for the actual child routes, and stores `data.featureKey` + `data.permissionCode` for later route-guard/metadata work.
- Manifest unit test inspects **actual** System routing table, checking registered route components, unique IDs and exact route metadata. This does **not** yet validate a manifest automatically exported from the Backend repository, nor dynamically render an Angular component from DB.
- A new `/system/feature-registry` page displays the Backend `GET /api/System/FeatureRegistry/preview` differences as a table with `Create/Present/UpdateRoute/Conflict` statuses and summary counts. A link from the Menu Administration toolbar opens it; there are **no hardcoded privileged Sidebar fallback links**.
- Apply button requires Preview with `canApply=true` and `hasPending=true`, an explicit `window.confirm`, and a separate `POST /api/System/FeatureRegistry/apply` call. After success it re-reads Preview. It shows errors for 403 and 409, clears stale information on failure, blocks concurrent/repeated actions, and cancels subscriptions on component destruction.
- Backend independently enforces **SystemAdministrator** for both endpoints, and additionally requires `Identity:FeatureRegistry:EnableApply=true` for Apply. The frontend is not an authorization gate.

## Operator steps

1. Deploy matching Backend FR-02A and this Angular UI. Backend Apply defaults OFF; preview can be used before enabling anything.
2. As an authorized System administrator, visit `/system/menu-management` and select **رجیستری قابلیت‌ها**, or navigate directly to `/system/feature-registry`.
3. Review every `Conflict` before changing anything. Confirm DB target and role/permission scopes using the approved SQL catalog inventory. Contact the platform maintainer if a Manual endpoint key conflicts.
4. Temporarily set backend `Identity:FeatureRegistry:EnableApply=true` for approved deployment. Review the page, confirm the explicit prompt and Apply. Then turn the flag OFF and re-check Preview.
5. New `ROLES.READ`/`PERMISSIONS.READ` and other metadata do **not** imply grants to existing users. Use a separately reviewed grant administration flow to assign view permissions to intended System roles; current-user Sidebar remains empty for ungranted users.

## Security and remaining work

- Does not change auth, JWT localStorage, interceptor, BFF flag, TenantContext or user-scoped Sidebar logic.
- Does not make `data.permissionCode` into a client-side guard: direct Angular navigation can still happen, and the backend must enforce actual authorization on each API. A DB-supplied route cannot dynamically load arbitrary Angular code.
- This is a first **two-feature** vertical. System users/groups/modules/tenants routes and tenant-specific feature manifests are not registered yet. A future generated versioned cross-repo artifact and checks against Backend metadata are required.
- Real SQL Server catalog rollout, concurrent apply, existing manual-menu conflicts, TenantPermissionRestriction and BFF browser cutover are separate release gates.
- Angular unit tests cover preview/apply HTTP contract, route manifest mapping, no automatic Apply, confirmation, conflicts and 403/409 stale state. Run CI unit and development build before merge.
