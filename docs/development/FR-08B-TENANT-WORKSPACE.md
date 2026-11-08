# FR-08B — First Tenant Admin workspace pages

2026-11-08. First tenant-scoped navigation milestone after the System Admin dashboard. **Read-only**: no implied authorization for Tenant administrators to edit people, branches, business profile, billing or tenant-wide permissions.

## Tenant login / routes

Existing tenant sign-in redirects to /dashboard, which is preserved as the child landing view under a new tenant-only workspace shell. The /dashboard parent has both tenantSessionGuard and canActivateChild, so /dashboard/business and /dashboard/branches are also protected. System routes remain under /system and continue to require separate System context.

- /dashboard — overview sourced from GET /api/tenant/workspace: own business name, branch count/main branch, requested plan and unconfirmed subscription status, with loading/error/retry/empty-profile handling.
- /dashboard/business — read-only onboarding/business profile information for the current tenant.
- /dashboard/branches — read-only list of current tenant branches, with main flag, city, address and phone, from GET /api/tenant/workspace/branches.
- Shared navigation/tenant shell with logout, responsive styling, and no functional buttons that lack a safe backend operation.

The typed TenantWorkspaceService sends requests only to fixed /tenant/workspace and /tenant/workspace/branches paths: no client-selected TenantId, no SystemAdministrator route, no cross-tenant repository access.

## Backend / safety

Companion Backend PR #51 adds branchesCount to existing workspace response and a separate authenticated, tenant-context-only GET branches handler. It validates an active readable current tenant and explicitly filters Branch.TenantId by the server-derived ActiveTenantId. No branch edit/create endpoint or arbitrary tenant lookup. Tenant user role-specific permissions will be a separate slice; read-only views are currently available to authenticated owning-tenant sessions with readable scope.

The subscriptionStatus is still the existing pending_activation placeholder. The requested plan is not confirmed billing, licensed access or paid subscription. Do not label this as successful activation.

## Acceptance / next work

Tests cover all three nested routes and guards, requests without tenant IDs, real profile/main branch, empty branches, 403/error retry, and loading states. No BFF flag, grant, migrations or production database writes. Continue with Tenant role/admin permission semantics, real membership/branch ownership queries and separate granular write contracts before mutating pages.

Tracker: https://github.com/sholehamed/foundation-backend/issues/44
