# FR-14C — System Admin central catalog readiness cockpit

Checkpoint: 2026-11-10. The System Admin is the only author of Menu, Category, Page, Resource, Endpoint and Permission definitions. Tenant users only receive centrally registered rights. This feature introduces **read-only diagnostics** inside the existing /system/feature-registry page; it does not grant new permissions, enable pilots or register records.

## Operator workflow

1. Sign in as the live persisted System SuperAdmin on the System origin; open the existing Feature Registry screen. The existing System Manifest/Preview are checked against executable Angular routes before its separately confirmed Apply can be used.
2. Read three independent reports (GET only, with no Tenant, user, role or branch identifiers):
   - `/api/system/FeatureRegistry/tenant-permissions/preview`: 17 registered Tenant PAGE/ACTION definitions, conflicts and pending additions.
   - `/api/system/FeatureRegistry/tenant-navigation/readiness`: six approved routes, canonical System-owned menus and categories, permission/UI links, unknown routes and ungated external URLs.
   - `/api/system/FeatureRegistry/system-endpoints/integrity`: runtime System endpoints vs central API/Resource/Permission graph, duplicates, foreign/stale links and unsupported endpoints.
3. A read-only **catalog-ready** message requires all three reports to be successful AND the System Registry Preview to have no conflicts/pending changes AND the Angular route manifest to match. Any 403/network problem, stale response during refresh, missing record or mismatch is NOT ready.
4. If a fix is needed, use the independently approved System Admin editor/Registry Preview and operator migration procedure. The Tenant catalog's existing fingerprinted Apply is a separate operator-controlled endpoint with its default-OFF flag; it is deliberately not invoked by this UI.
5. Review final reports again immediately before enabling any read-only dynamic Tenant navigation pilot. Grant review, two-Tenant browser revoke/deny, TLS ingress, BFF secrets/keyring, SQL migrations and Staging approvals are separate gates.

## Safety

- No activation of `Identity:FeatureRegistry:EnableApply`, `Identity:TenantPermissions:EnableCatalogApply`, `Identity:PlatformPermissions:EnforcePermissionEndpoints`, or Angular `tenantDynamicNavigationPilotEnabled`.
- Three diagnostics are protected by server-side SystemAdministrator **and live System SuperAdmin** checks. Angular's read of them is not an authorization mechanism. A non-SuperAdmin still sees the existing System Registry preview (where otherwise authorized), but a forbidden diagnostic is explicitly failed/hidden.
- When a System Registry Apply finishes the diagnostics refresh; changing catalogs is never interpreted as a successful Tenant permission grant.
- A successful catalog-ready message is **not** evidence that any target environment is deployed or production ready.

## Tests / next phase

Angular request contract tests enforce fixed GET URLs and empty query parameters. Component tests exercise incomplete catalog, 403 denial, lack of auto-Apply, all-clear status and drift invalidation. Backend SQL and signed HTTP suites cover the three diagnostic endpoints independently.

Next: expand disposable live HTTP/SQL operator acceptance and a matched Chromium run, then isolated Staging read-only preflight, manual Registry/menus reconciliation, branch entitlement review and explicit human pilot approval. Do not silently move onto Production.
