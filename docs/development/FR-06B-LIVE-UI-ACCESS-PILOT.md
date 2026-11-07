# FR-06B — Angular live System UI permission pilot (Roles permissions)

> 2026-11-07. The first safely scoped live current-user UI route/action pilot. Companion Backend [PR #48](https://github.com/sholehamed/foundation-backend/pull/48). **No automatic grants, DB migration, backend policy flag change or BFF cutover.**

## New Backend contract

`GET /api/System/UiAccess/me/{key}` is a read-only SystemAdministrator-protected endpoint that returns `{key,allowed}` with `Cache-Control: no-store`. Backend validates active System user and Master Tenant, the code-owned root PAGE and optional nested PAGE/ACTION metadata, a single exact active PermissionUiResource link and live direct/role/group grants (direct deny wins). It never accepts a caller-supplied role/user/tenant ID or a permission code.

Angular `SystemUiAccessService.canAccess(key)` requests the decision afresh, rejects mismatched keys, unexpected payloads and all HTTP/network errors. It never reads token `permission_code` snapshots or caches grant results.

## First pilot and activation

The route `/system/roles/:roleId/permissions` references `system.roles.permissions` in its Angular Route.data and uses `systemUiAccessGuard`. The Roles list only displays the associated menu entry when the current user has live PAGE access. The Role Permissions form's **Save** is enabled only when the ACTION `system.roles.action.assign-permissions` is allowed, and the action is checked *again* when the user clicks Save to prevent submission based on a stale UI decision.

These are references to stable keys; actual Permission.Code and Resource owner definitions remain solely in the Backend Registry.

A new explicit build-time flag `systemUiAccessPilotEnabled` is present in normal, production and E2E environments, and is **false in all three**. When OFF, routes, list items and save behavior remain unchanged, so upgrading Angular alone cannot lock out existing admins who have not yet applied the catalog.

### Enable in an approved test environment

1. Deploy compatible Backend [FR-05 manifest v2 + FR-06A UiAccess endpoint] and Angular FR-06B.
2. Review the real SQL Identity catalog with existing read-only inventory, take a backup, and perform the **manually approved** Registry Apply after resolving any conflicts. `Identity:FeatureRegistry:EnableApply` remains OFF by default; enable it only temporarily if the approval plan requires it. Do NOT automatically grant roles.
3. Through the existing System administration workflow, explicitly grant **`ROLES.READ` and `ROLES.ASSIGN-PERMISSIONS`** to approved Master-scoped operators. Validate direct deny, revocation and inactive entries.
4. Set `systemUiAccessPilotEnabled: true` in the test build's environment and rebuild/deploy **only after** verifying step 3. Check the route, list menu and Save behavior. A denied guarded route is redirected to `/system/dashboard?accessDenied=1` (it is not a success/fallback authorization).
5. Switch off/rebuild to roll back the pilot without touching user grants. API behavior remains independently secured by its existing SystemAdministrator policy and opt-in `Identity:PlatformPermissions:EnforceRoleEndpoints` flag; client UI checks are not an API security boundary.

## Tests and boundaries

- Service: fixed current-user URL, no RoleId/TenantId/Permission.Code in the request, no-store, false on deny, stale response key, network, HTTP 401/403/500 or malformed key.
- Guard: pilot OFF preserves behavior; pilot ON allows only a new true decision and redirects denied/unknown metadata; second navigation rechecks the live Backend.
- Role list: Management entry hidden/visible with current-user PAGE access in opt-in mode, and unchanged when pilot OFF.
- Role Permissions page: before saving, recheck ACTION live; a revoked permission blocks the write even if the initial page hint was true.
- This slice does **not** implement all 13 parent root routes or 41 subordinate elements, cached/bulk grants, Tenant-specific checks, permission-based API enforcement or a full 403 screen. Those need separate incremental release gates. Existing System Admin/User create/edit remains blocked only by its inactive metadata, not by an Angular route guard.

See [Backend FR-06A runbook](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-06A-LIVE-SYSTEM-UI-ACCESS.md) and [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).
