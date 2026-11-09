# FR-13C-2B — Tenant group member management (Angular)

Companion to Backend [FR-13C-2B](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13C2B-TENANT-GROUP-MEMBERS.md).

- Route `/dashboard/groups/:id/members` requires the existing Tenant session, an effective `TENANT.GROUPS.READ` PAGE and a separate `TENANT.MEMBERS.READ` PAGE. This Angular route guard is UX only; API authorization is authoritative.
- From the Tenant Groups list, the Owner opens the Group membership page. A signed Group version and **20 eligible ordinary users at a time** are displayed without emails, tokens or other secret fields.
- A mutation is a separate, confirmed `PUT /groups/{groupId}/members/{userId}` with only `{assigned,expectedVersion}`. The UI does not accept a TenantId, actor, arbitrary roles, or an entire page of member IDs for replacement.
- A missing Owner `canEdit` suppresses all mutation buttons. An inactive group forbids new membership but permits revocation. After a successful mutation, reload the server page and version. On 403/404, clear member data. On 409, explicitly reload and require re-confirmation; never silently retry a stale write.
- Backend independently requires the registered `TENANT.GROUPS.ASSIGN-MEMBERS` ACTION, Owner, the active home Tenant, scoped SQL CAS, target validity and append-only audit. Changes can immediately affect rights inherited from **existing** group-linked Roles.
- No `GroupRole` write UI yet. GroupRole will receive a **separate** reviewed ACTION and audit in FR-13C-2C. No staging or production deployment.

Tests: `tenant-group-members.spec.ts`, `tenant-group-members.guard.spec.ts`,
`tenant-workspace.routes.spec.ts`, `tenant-workspace.service.spec.ts`.
