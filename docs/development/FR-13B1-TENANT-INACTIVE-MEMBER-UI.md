# FR-13B-1 — Tenant members: create an inactive local account

2026-11-09. Companion to Backend [FR-13B-1 PR #73](https://github.com/sholehamed/foundation-backend/pull/73) / [Issue #72](https://github.com/sholehamed/foundation-backend/issues/72). Parent [FR-13 #70](https://github.com/sholehamed/foundation-backend/issues/70).

## User-visible contract

The existing `/dashboard/members` directory remains Tenant-only and server-scoped. When `GET /api/tenant/workspace/admin-capabilities` returns both `canViewMembers:true` and `canCreateMembers:true`, the page displays an **Add inactive member** action and a small form requiring username, email, first name and last name. Buttons are never shown for denied/unavailable capabilities. Right before POST the component re-fetches live server capabilities; stale permission fails closed, clears potentially stale member list and disables creation.

`TenantWorkspaceService.createPendingMember` sends `POST /api/tenant/workspace/members` with **only** `{userName,email,firstName,lastName}`, never TenantId, IsActive, Owner, password or roles. Backend derives authorized Tenant/Owner scope, checks code-owned `TENANT.MEMBERS.CREATE` ACTION and records the new User + SQL audit atomically.

On confirmed server response `{id,userName,email,firstName,lastName,isActive:false}`, the list is reloaded and the UI states **account inactive, no invitation/login issued**. Invalid/duplicate/rate-limited requests show clear recoverable errors; 401/403/404 revoke local create permission and clear member rows. The frontend does **not** attempt to interpret role names or grant authorization.

## Limitations / deployment

- This is **not** email invitation, activation, temporary password, or a usable employee login. Created accounts are disabled, have a strong unshared unknown password and no roles/grants.
- Backend migration `20261109010000_tenantmemberlifecycleaudit` and reviewed System Admin Tenant catalog Preview/Apply/Owner privileges are required before creation works. None is automatically run by either repository merge. A missing/unapproved catalog denies the new action.
- Angular BFF Tenant cookie pilot remains OFF in all environments. Native bearer and other Tenant routes remain unchanged.
- FR-13B-2 must implement secure single-use invitation/activation, then actual multi-account Chromium + HTTPS/SQL role assignment, menu visibility and revoke E2E.
- This change intentionally reuses the existing directory route/guard rather than introducing a new unregistered PAGE route.

## Verification

Service test checks exact HTTP path/body with no client scope or credential fields. Component tests cover capability-hidden action, a fresh capability decision before POST, confirmed inactive user status and denial without POST. Required: frontend unit/build CI success plus backend Tenant SQL/real HTTP suite success on their respective PR heads.
