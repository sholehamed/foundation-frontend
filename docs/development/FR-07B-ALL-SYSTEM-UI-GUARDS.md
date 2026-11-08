# FR-07B — System-wide UI route guards and action affordances

> 2026-11-08. Companion to [Backend FR-07A PR #49](https://github.com/sholehamed/foundation-backend/pull/49). The change is opt-in for deployments without an approved Registry Apply/role grant rollout.

## Scope shipped in code

- The System layout uses one `canActivateChild` guard for **every executable root and nested PAGE**. It calculates the exact Angular route-template path from the Router's activated `pathFromRoot`, including `:guid` parameter placeholders and resource-scoped nested routes. It skips only redirects, lazy/container routes with children, and the separately defined System login/access-denied routes. An unknown or disabled PAGE fails closed into `/system/access-denied` (not an authorized Dashboard fallback). Existing session guard still applies.
- The backend-only source of truth is `GET /api/System/UiAccess/me`: one current-user snapshot containing **80** access decisions (**13 root PAGE + 32 nested PAGE + 35 ACTION**). The client validates schema v2, keys, route uniqueness and PAGE/ACTION type, and shares a single HTTP request between route guard and visual affordances per navigation. `NavigationStart` resets the cache. No permission claims, RoleId, UserId, TenantId, or Permission.Code values in client requests. All errors/401/403/invalid responses fail closed when enabled.
- New structural `*systemCan` directive uses either Backend-owned exact route templates (for Create/Edit/resource nesting and navigation links) or stable ACTION keys (for delete/state/lock/menu/group/registry operations). When the rollout flag is off it renders existing controls unchanged. Existing System list pages now use this directive for user, admin, role, group, module, tenant, resource, permission, API and UI resource actions. Route guards protect direct typed URLs even if buttons are hidden.
- The sensitive Role Permissions Save, Menu Management create/update/delete/reorder, Group Member add/remove, and Feature Registry Apply perform a fresh snapshot decision at click time; a previously granted but revoked ACTION cannot issue their UI-origin write merely based on stale presentation.
- Corrects two dead links observed in the System UI: the nonexistent Group Roles permissions route is not displayed and Tenant detail now targets the existing `/:tenantId/overview` route. The not-yet-created Tenant Users child route is removed from the actions list.

## Activation remains explicitly gated

`environment.systemUiAccessPilotEnabled` is **false** in all three Angular configurations, including production and E2E. It now gates the **whole System UI**, not just the original Roles pilot. Until approved target SQL Registry Apply and Master-grant assignments have been reviewed, DO NOT enable it; enabling on an unseeded database intentionally denies all PAGE routes, including Dashboard. When false, no existing route or action is newly denied by the permission layer.

Before enabling in a test build:
1. Deploy the matching backend including the new bulk endpoint and 26 additional ACTION descriptors. Run read-only catalog inventory and reviewed Preview against a disposable/approved target, then Apply with temporary backend opt-in; take backup and resolve conflicts.
2. Explicitly grant the intended active System Master roles `*.READ` and matching CREATE/UPDATE/DELETE/ACTION permissions. Test direct deny, inactive Admin/User dangerous forms and revocation of role/grants.
3. Enable the UI flag for a dedicated test build. Verify every root PAGE and nested route, category/Sidebar behavior, action controls and all sensitive click-time requests; check API 403 behavior separately. Rebuild with flag OFF to roll back UI gating.
4. Only consider API granular authorization and production BFF/browser cutover in separately reviewed releases. UI routing and buttons are not an API security boundary.

## Known limitations

- Legacy `SystemAdministrator` and existing per-endpoint opt-in guards are still the final server authority; a malicious direct request bypasses Angular UI guard. Many CRUD endpoints do not yet enforce per-Permission.Code authorization.
- Some destructive CRUD handlers outside the specifically rechecked sensitive actions depend on route/presentation access; they still require backend granular authorization for secure write-time enforcement.
- Group role assignment, Tenant Users and some System Admin/User workflows are incomplete in the actual Angular build; registering a missing ACTION does not fabricate a working page. Admin/User sensitive metadata remains inactive by default.
- Existing controls that were placeholders (e.g. standalone Delete buttons without click handlers) are only hidden by UI hints; no business behavior is invented by the directive.
- No Tenant-specific UI gate, no offline data sync, and no SQL Server concurrent FeatureRegistry Apply release certification.

Tests verify all System route guard attachment, nested route-template matching, refusal of unknown/invalid snapshots, no request duplication per navigation, fresh action revocation checks, default-OFF behavior, and standalone directive visibility. Backend tests verify scoped grants and SQL catalog metadata separately. See [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).

## Live Sidebar and action-time hardening (final FR-07B slice)

- In enforced System mode, Sidebar joins the existing current-user `Menus/me` response with the same already-shared `UiAccess/me` snapshot. It filters out unknown, denied, disabled or external PAGE links while preserving containers that still have authorized children. Any missing/invalid permission response results in an **empty** navigation rather than a privileged fallback. Tenant sidebar is unaffected; the flag remains OFF by default.
- Existing System CRUD list toggles (change-state and account lock), actual Delete handlers, API resource sync, group member add/remove, Menu Management and Registry Apply now **recheck ACTION access at click time** while enforced; revocation between page render and click stops that UI-origin write. Their API endpoints continue to require independent live authorization and are **not secured by the client**.
- Dead, unimplemented placeholder buttons or missing Group Role assignment screens are not invented; metadata-only ACTIONs have no new frontend workflow. System Admin/User sensitive catalog entries remain disabled and their backend write flows still require separate review.
- Latest build/unit gate, exact System route coverage and actual target DB grant rollout are required before enabling.
