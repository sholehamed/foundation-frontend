# FR-12D — Tenant member direct-role assignments

2026-11-08. Companion to backend FR-12D. Child route: `/dashboard/members/:id/roles`, guarded by Tenant session and Members.Read route guard. Backend independently additionally enforces Roles.Read for matrix reads.

Members directory now links each member to the role matrix. The page displays ordinary local roles only, including inactive ones. `canEdit` and `version` come from the authenticated server; Owner/self-target/inactive-target and non-owner sessions are read-only. The page never treats direct UserRole membership as full effective permissions from groups/direct user overrides.

Edit mode sends `PUT /api/tenant/workspace/members/{id}/roles` with `{expectedVersion,roleIds}`. RoleIDs come from the server-returned ordinary local role list, without TenantId, actor or reserved Owner roles. Inactive roles may be retained or revoked if already assigned, but a new inactive assignment is blocked in UI and Backend. 409 discards stale drafts and reloads, 403/404 clears stale matrix, other failures retain draft for retry.

SQL Server-only Backend performs live owner/permission checks, active target ownership and User RowVersion CAS, writes UserRole links and immutable per-change TenantMemberRoleAuditEntries in one transaction. A checked box is never authorization.

Code merge does not apply production migrations, catalog metadata, roles or UserRole writes. Operator-controlled migration + FR-12A preview/apply are required before production activation. Follow-ups: invited members, groups, finer-grained delegation, historical audit page, browser E2E and BFF cutover.