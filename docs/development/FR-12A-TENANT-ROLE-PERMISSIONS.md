# FR-12A — Tenant role permission matrix (read-only)

Date: 2026-11-08. Companion to Backend FR-12A.

**Route**: `/dashboard/roles/:id/permissions`. It inherits the Tenant session guard and the exact `TENANT.ROLES.READ` per-page guard. The role list now offers "مشاهده مجوزها"; the destination calls `GET /api/tenant/workspace/roles/{id}/permissions`. No tenant ID is taken from Angular. Backend validates the live caller's permission and checks that the requested role belongs to the active tenant.

The responsive page shows each code-owned PAGE/ACTION permission and two different facts: whether the global SQL Permission definition is registered, and whether **that role** has a direct RolePermission. It does **not** show the requesting user's effective permission, nor inherit UserPermission/group/superadmin grants. Errors/revocation clear stale rows.

This page intentionally has no editing controls. The catalog Preview/Apply operation is separately system-admin only, OFF by default and never grants roles or users. A future audited, SQL-concurrency-safe grant API is required before making toggles editable. Related: backend #44 and FR-11A/FR-12A.
