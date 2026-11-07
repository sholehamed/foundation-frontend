# FR-03B-1 — Validate Angular executable routes against authoritative backend manifest

> 2026-11-07, companion to Backend [FR-02B-1 PR #45](https://github.com/sholehamed/foundation-backend/pull/45).

## Source ownership, not duplicated permissions

- Backend `FeatureRegistryDefinitions` is now the **only production source** of feature/page keys, Permission.Code, Module/Resource ownership and view-grant contracts.
- Angular `system-feature.manifest.ts` contains only executable System route segments `users`, `roles`, `permissions`; `system.routes.ts` uses those exact segments. It intentionally **does not embed backend feature keys or permission codes**.
- Backend `GET /api/System/FeatureRegistry/manifest` (SystemAdministrator only) provides `{schemaVersion:1,features:[{key,moduleCode,resourceCode,route,pageKey,readPermission}]}`. It does not expose actor grants and does not dynamically load Angular components.

## Runtime compatibility gate

The Registry administration page requests both `/preview` and `/manifest` together before offering Apply. Pure `validateBackendFeatureManifest()` checks schema v1, unique keys, unique routes, well-formed System read permission codes, consistent page keys and **exact matching sets of backend routes and Angular executable routes**.

- Unknown backend route, unsupported schema, duplicate/invalid key, missing local route, or failed request prevents the frontend **Apply** button from operating; errors are shown on the review page.
- Explicit human confirmation is still required; backend independently enforces live `SystemAdministrator` and its default-OFF `Identity:FeatureRegistry:EnableApply` switch. A direct API caller is not gated by the browser route check, so deployment reviews must still ensure the Angular and backend versions are compatible.
- Manifest is checked again after successful Apply. An application build cannot safely assume the backend deployment has the same version without runtime verification.
- The real Angular System routes are separately checked by Vitest against the route-only index. No client-side Menu visibility equates to API authority, and no client-side route guard was added.
- Existing User Routes are now part of this first three-feature contract. Role/Permission operations still enforce whatever live server policies already protect them; descriptive registry metadata is not auto-enforcement.

## Safe deployment and next tasks

1. Deploy compatible backend FR-02B-1 and frontend FR-03B-1 versions (server first or together); old backends missing `/manifest` will cause the review page to **fail closed** instead of issuing Apply.
2. Verify a live SystemAdministrator can fetch Manifest and Preview; review DB diffs. If `USERS.READ` is owned by another Resource, the backend Preview blocks Apply (manual DBA review needed).
3. Do not enable the Apply server setting on the target production DB without the existing [FR-02A runbook](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-02A-FEATURE-REGISTRY.md), sanitized SQL inventory, a backup and rollout plan. This PR makes **zero** grant or auth/BFF changes.
4. Future work: versioned cross-repo CI artifact/signature, all remaining System/Tenant features, stable Menu.Key/Scope and SQL Server concurrent Apply tests, actual browser HTTPS BFF release gates. Follow [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).

### Unit test acceptance

- Current Angular lazy route definitions match all three route segments without duplicating keys.
- Pure validator rejects missing/excess routes, duplicate keys, unsupported schema and malformed permissions.
- HTTP service uses fixed `manifest`, `preview`, `apply` paths with no client-chosen RoleId/TenantId.
- Admin page blocks Apply on failed manifest, drift, preview conflict or 409 and otherwise requires explicit confirmation.
