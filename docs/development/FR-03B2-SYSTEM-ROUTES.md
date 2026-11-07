# FR-03B-2 — Full System route-index coverage

> Companion to Backend [PR #46](https://github.com/sholehamed/foundation-backend/pull/46), 2026-11-07. All current top-level System Angular pages are registered as executable route references. No client-side permission grants or API enforcement changes.

## What changed

The frontend-owned `system-feature.manifest.ts` continues to contain **only** executable route *segments* — no duplicated Feature.Key or Permission.Code. It now enumerates all **13** existing root pages from `system.routes.ts`:

`admins`, `users`, `roles`, `groups`, `dashboard`, `tenants`, `modules`, `permissions`, `api-resources`, `ui-resources`, `resources`, `feature-registry`, `menu-management`.

Every route entry is now wired to the same `systemFeatureRouteSegments` constant, preserving all existing lazy imports, child route structure, guard, breadcrumbs and behavior.

The backend `GET /api/System/FeatureRegistry/manifest` is the only source of the stable PageKey, ResourceCode, Permission.Code and registered path. Its v1 manifest now advertises these same 13 routes. At runtime, the admin Registry page loads **both** Manifest and Preview and rejects incompatible versions, missing/extra paths, duplicate/invalid feature keys and malformed permission names; Apply remains unavailable on mismatch. These are consistency protections for the UI and **not** a substitute for backend authentication/authorization.

## Test gates

- Unit test enumerates the full root `system.routes.ts` children and requires an exact match with the 13 route segments — no new System root page is silently omitted.
- Runtime contract test rejects backend-only/Angular-only routes, repeated stable keys and unsupported manifest schema.
- Admin UI test exercises compatible manifest, drift failure, rejected preview, 403 and 409 handling without unauthorized Apply.
- CI: `npm run test:unit` and `npm run build -- --configuration development` before merge.

## Deployment/runbook

1. Deploy compatible backend FR-02B-2 and Angular build. A mismatch intentionally blocks frontend Apply, even if backend Preview reports new catalog rows.
2. Existing direct links and current-user sidebar work independently of Registry definitions; missing grants remain missing. The new database menu entries appear only after reviewed Apply **and separate, explicit** role grants.
3. The backend registration of a feature does not repair unrelated Admins/permission editing behavior. Do not infer production readiness or API-level granular enforcement from a visible page.
4. The backend `Identity:FeatureRegistry:EnableApply` remains **false by default**. Perform the target SQL catalog inventory before any production apply; existing Permission.Code ownership/legacy permissionless menu rows may create blocking conflicts. No target DB writes were performed as part of this PR.
5. Future independent gates: generated cross-repo build-time contract, missing/extra backend endpoint metadata coverage CI, real SQL Server FeatureRegistry race/transaction E2E, stable Menu.Key/Scope, granular permission enforcement and BFF browser certification.

See [backend FR-02B-2](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-02B2-SYSTEM-PAGES.md) and [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).
