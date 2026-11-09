# FR-13C-2C — Tenant GroupRole editor (Angular)

Companion to Backend [FR-13C-2C](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13C2C-TENANT-GROUP-ROLE-GRANTS.md).

- Tenant Admin route `/dashboard/groups/:id/roles`, reachable from the existing Group directory. Existing session guard and `tenantOwnerDirectoryGuard` require active Tenant session + Groups PAGE. A second `tenantGroupRolesGuard` requires **both** live Groups and Roles PAGE grants before rendering. These are UX guards, not a substitute for backend enforcement.
- Server pages 20 ordinary Tenant Roles at a time (Owner/System/foreign roles absent), with Group `RowVersion`, each Role's activation state, assigned flag, Group activation and live `canEdit` from Owner+ACTION authorization.
- A mutation is confirmed **one Role at a time**. The component sends only `{assigned,expectedVersion}` via `PUT /groups/{groupId}/roles/{roleId}`. Never sends TenantId, actor or a truncated list of roles. Inactive Group/Role blocks additions, but existing links may be revoked.
- On successful response, discard old matrix and reload. On 401/403/404, discard stale privileges and matrix. On 409, discard stale matrix and reload, requiring the user to re-confirm rather than auto-replaying a privilege grant.
- The backend independently requires explicit reviewed `TENANT.GROUPS.ASSIGN-ROLES` ACTION + local Owner, denies self-group and Owner-containing Group, enforces Tenant scope, SQL Group CAS, immutable audit, and immediate live permission revocation.
- No new static navigation, no Staging or Production operations. Explicit SQL migration and catalog Preview/Apply are needed at separately approved rollout.

Regression: `tenant-group-roles.spec.ts`, `tenant-group-roles.guard.spec.ts`, `tenant-workspace.routes.spec.ts`, `tenant-workspace.service.spec.ts`.
