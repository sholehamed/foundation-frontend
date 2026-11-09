# FR-13C-2D — Group security history and review (Angular)

**2026-11-09 — code only.** Staging remains deferred.

The `/dashboard/groups/:id/audit` page extends Tenant Admin Groups. Existing Tenant session + Groups directory guard apply; a new `tenantGroupAuditGuard` requires a fresh `canViewGroupAudit === true` response from Admin Capabilities. Backend independently rechecks Owner, Groups.Read, Members.Read, Roles.Read, Tenant scope and SQL availability.

`TenantWorkspaceService.getGroupSecurityAudit(groupId, page)` sends ONLY a UUID route target and bounded `page`. It never sends a TenantId or actor parameter. The page shows the three append-only event categories (group lifecycle, member grant/revoke, role grant/revoke) with Persian/Jalali timestamps, group/member/role labels and actor. The integrity panel displays current total links, historical OWNER/nonlocal targets and links without corresponding retained audit grants. Only the Owner can see the link from Tenant Groups; no new static sidebar item. No mutation controls.

On HTTP 401/403/404, all loaded events and counters are cleared and automatic retries are disabled. A 409 is not relevant to this read-only page. Pages are fetched individually, never as an unbounded history. Malformed counters or mismatched group/page results are rejected.

**Important operational caveat:** An unmatched retained grant event does **not** establish illegitimate access. Existing relationships may predate audit logging, and the absence of audit cannot be turned into evidence against staff. No automatic remediation, migration, Registry Apply, staging deployment or production rollout. Any historical cleanup requires independent review and an approved reversible plan.

Regression: `tenant-group-audit.spec.ts`, `tenant-group-audit.guard.spec.ts`, `tenant-groups.spec.ts`, `tenant-workspace.routes.spec.ts`, `tenant-workspace.service.spec.ts`.
