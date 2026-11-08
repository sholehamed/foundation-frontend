# FR-09A Tenant Admin — owner directory screens

2026-11-08. Companion to backend FR-09A. Existing /dashboard/business and /dashboard/branches remain read-only.

- New /dashboard/members, /dashboard/roles, /dashboard/groups: shared paged read-only directory UI; next/previous, active status, loading/empty/retry, clear sensitive rows on errors.
- Parent tenantSessionGuard is retained. New tenantOwnerDirectoryGuard checks server-derived /tenant/workspace/admin-capabilities for each privileged route; navigation links are hidden unless live capability is granted.
- Backend separately validates local active Owner assignment on *every* list request; hidden controls and Angular guard are not the security boundary.
- All requests are to fixed tenant/workspace paths. No user-provided tenant ID, system-admin API reuse, invitations, changes, grants, billing, role mutations or migrations.
- Legacy signup Owner role is compatible; new signup marks Tenant scope explicitly.

Still pending: Tenant permission registry, scoped CRUD and assignment, branches policy, SQL populated-catalog tests, browser end-to-end, BFF cutover and reviewed production activation. See backend issue #44.
