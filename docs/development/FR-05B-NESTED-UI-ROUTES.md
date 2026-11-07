# FR-05B — Angular nested UI route compatibility against Backend manifest v2

> 2026-11-07. Companion to Backend [FR-05A PR #47](https://github.com/sholehamed/foundation-backend/pull/47). Adds no new Angular views, permission grants or route enforcement.

## Runtime discovery, no duplicate child route manifest

The System Feature Registry page now derives its **nested executable PAGE routes** directly from the real Angular lazy route tree using `discoverExecutableSystemChildRoutes()`, only when an authorized user opens the Registry admin review page. This traverses `system.routes.ts`, lazy `loadChildren`, Angular's dynamic-import **default exports**, and ordinary `children`; skips route redirects/wildcards, layout containers and the 13 root pages already registered as Feature.PAGE. The 32 discovered URLs include the actual `:roleId`, `:groupId`, `:tenantId` and `:resourceId` Angular route parameter names as exact templates.

No second production list of these 32 routes is maintained. An exhaustive Vitest inventory verifies exactly which actual child paths exist, so future Route additions must update a reviewed backend descriptor. Nested PAGEs never automatically create Sidebar Menu records.

## Backend manifest v2

`GET /api/System/FeatureRegistry/manifest` is still live SystemAdministrator-only and now advertises:
- `schemaVersion: 2`;
- existing `features` (13 stable root pages, Backend-owned Resource/Permission keys);
- new `uiElements` (32 PAGE + 9 ACTION descriptors) with `{featureKey,key,route,type,permissionCode,defaultActive}`.

The Angular review UI fetches Manifest + Preview and resolves actual child routes before enabling Apply. It refuses action if any of the following occur: old/new schema version, missing/duplicate root or child path, unknown page/feature ownership, malformed permission code, duplicate UI key/route, PAGE with invalid path, ACTION with an executable route, or missing lazy configuration import. On errors the user sees a review warning, not an automatic write. The backend remains the only authority for API/permissions and requires explicit `Identity:FeatureRegistry:EnableApply=true` for Apply, default OFF. This browser UI compatibility check is **not a direct-API security policy or route-guard**.

## Security and rollout

- No controller, Angular route or permission guard is created by metadata; menu visibility and API authorization must still be enforced separately.
- Backend catalog initially creates System Admin and User write forms inactive (known unsafe/unsupported write flows); this **does not disable the existing Angular URLs** and does not certify these screens. Do not enable those UI resources before separate review.
- `UiResource` and `PermissionUiResource` are persistent descriptors. Actions record intended grants but do not automatically hide/show buttons; additional guarded UI integration is a future slice.
- Deploy backend FR-05A and frontend FR-05B together. Old v1 frontend/new v2 backend (or vice versa) intentionally prevents Apply, not reads or normal pages.
- Production DB inventory, SQL Server Registry transaction/race/rollback tests, stable Menu.Key/Scope and BFF browser cutover remain separate release gates.
- Tests cover all 32 real nested URL patterns, v2 exact-match validation, incompatible schema/owner/permission/actions and no writes on preview/manifest failure.

See [Backend FR-05A](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-05A-NESTED-UI-REGISTRY.md) and [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).
