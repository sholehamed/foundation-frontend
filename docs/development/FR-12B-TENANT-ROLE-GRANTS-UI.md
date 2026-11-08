# FR-12B — Tenant role permission editor

2026-11-08. Companion to Backend FR-12B.

The existing `/dashboard/roles/:id/permissions` page is editable only when the **server** returns `{canEdit:true,version:"<SQL-RowVersion>"}` with a fully registered code-owned catalog. For other users, roles, or missing catalog definitions the view remains read-only. Edit checkboxes are restricted to the recognized, registered Tenant PAGE/ACTION keys; the browser never supplies TenantId or actor identity.

`PUT /api/tenant/workspace/roles/{id}/permissions` sends `{expectedVersion,codes}`, with only requested keys; the backend checks the live local Owner and target, SQL CAS, grants, and append-only audit in one transaction. A 409 discards draft values and fetches the latest matrix; 403/404 clears stale role state; ordinary errors retain draft for retry. The frontend never claims success before PUT responds.

Required deployment order: reviewed SQL migration for TenantRoleGrantAuditEntries and operator-reviewed FR-12A catalog Preview/Apply (default OFF). The merge does not apply migrations, seed/assign grants, or enable a production flag. No delegated tenant IAM management, dynamic DB menus, or BFF cutover here. See backend Issue #44.
