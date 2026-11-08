# FR-12C — Tenant Role Management UI

2026-11-08. Dedicated `/dashboard/roles` management page, preserving the exact `TENANT.ROLES.READ` route guard and tenant-session checks.

Tenant Roles API now returns `isOwner` and `version` for each page item; `getAdminCapabilities` includes three independent `canCreateRoles`, `canUpdateRoles`, `canChangeRoleState` hints. The standalone page uses forkJoin to fail closed on missing capabilities/403 and requires explicit server booleans before presenting mutation controls. These are not authorization: Backend validates live Owner, action permissions, scope, target and SQL RowVersion.

Create POST sends only `{name,description}`. Edit PUT sends `{name,description,expectedVersion}`. Status PATCH sends `{isActive,expectedVersion}` after a separate inline confirmation with an explicit reminder that disabling stops effective role grants but leaves assignments intact. No client TenantId, Owner flag, Scope or permission list is sent. Owner role is shown but not editable. A manager with their own role assigned is also denied server-side.

On success page reloads; on 409 draft is discarded and fresh version fetched; 403/404 clears potentially stale role list and capabilities. Page supports 20-item pagination. `TenantRolePermissionsComponent` still manages direct grants independently. Member/group directories remain unchanged.

Code merge does not migrate target SQL databases, apply catalog changes, create production roles or activate BFF. Backend FR-12C migration and manually approved registry Apply remain separate deployment steps. Next: user-role membership with audit and least-privilege guards.