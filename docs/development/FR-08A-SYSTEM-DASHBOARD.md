# FR-08A — System Administrator dashboard experience

2026-11-08. Improves the real landing page after System login at /system/dashboard. Compatible with the matching Backend FR-08A summary endpoint. No mocked stats, synthetic revenue graph, auth/BFF/role changes or migrations.

## What is new

- Responsive 9-card platform overview: total/active/inactive business tenants, all/active user accounts, roles, permissions, modules and groups; correct Roles field (previously duplicated totalUsers).
- Actual active-business ratio and split of System/Tenant user account types, from backend persisted data. Master Tenant is excluded from business counts by the server. No claim these metrics are paid plans, seat counts, billing or uptime.
- Six newest tenants (server CreatedAt sort), status, dates if valid and links into existing Tenant detail pages; permission-aware shortcuts to already implemented System pages.
- Proper loading/error/403/retry/empty states and cancellation on component destroy. Server response compatibility checked; no unsafe non-null assertion. No default UI access pilot activation.
- The existing auth flow already redirects System logins to /system/dashboard and the SystemAdministrator API policy remains the backend boundary.

## Deployment

Deploy backend [FR-08A PR #50](https://github.com/sholehamed/foundation-backend/pull/50) before or together with this frontend. The updated response is backward-compatible, but this new frontend requires recentTenants/activeUsers/new fields and deliberately reports an incompatible server response as an error rather than inventing zeros. Existing system routing and authentication remain unchanged.

Unit tests validate the fixed HTTP URL, correct Roles KPI, real tenant rows, active ratio, loading then empty, 403 failure and explicit retry.

## Next milestone — Tenant Admin

Tenant Admin currently has only a read-only /dashboard workspace summary served by /api/tenant/workspace (tenant, business profile, main branch, placeholder pending_activation subscriptionStatus). It is not connected to SystemAdministrator dashboard or grants. Next FR-08B begins a tenant-owned workspace profile and branch view under tenantSessionGuard, with separate API checks scoped to the authenticated TenantContext; it will not expose cross-tenant admin endpoints or pretend billing is active.

Related [issue #44](https://github.com/sholehamed/foundation-backend/issues/44).
