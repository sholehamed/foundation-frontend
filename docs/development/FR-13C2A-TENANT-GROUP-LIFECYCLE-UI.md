# FR-13C-2A — Tenant Group management UI

Companion backend contract:
[FR-13C-2A](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13C2A-TENANT-GROUP-LIFECYCLE.md).

- Existing permission-backed /dashboard/groups PAGE loads a dedicated
  tenant-groups.component with the existing tenant session + PAGE guard;
  no static navigation item or broad fallback access added.
- Read list is paged and tenant-scoped by backend. Every row includes
  server SQL RowVersion used as expectedVersion for edit and state.
- Three independent server Owner capabilities canCreateGroups, canUpdateGroups,
  canChangeGroupState hide disabled controls. They do not authorize writes;
  backend always repeats Groups.Read, exact ACTION, Owner/tenant checks.
- Create only sends {name,description}; edit sends expectedVersion as well;
  state change requires a separate confirmation, sends {isActive,
  expectedVersion} and warns that restoring a Group can restore inherited
  access where earlier membership/role links exist.
- No users, roles, permissions or TenantId are client-controlled in these
  APIs. No GroupRole/UserGroup editing controls until separate FR-13C-2B
  security review and storage-layer grant intent is implemented.
- 409 causes list refresh instead of blind retry. 403/404 drops stale
  list/capabilities. Empty, paging and error states are explicit.
- Frontend CI: Group lifecycle component tests + API contract tests,
  existing Tenant role/member/BFF regressions and Chromium pilot.
- Defaults unchanged; no Staging/Production rollout.
