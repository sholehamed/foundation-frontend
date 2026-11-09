# FR-13C-1 — Tenant Owner security activity page

Companion to Backend [FR-13C-1](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13C1-TENANT-MEMBER-AUDIT.md).

- Route: `/dashboard/member-audit` with optional `?memberId=<guid>`.
  First the existing Members PAGE guard, then a fresh `canViewMemberAudit`
  Owner capability guard. These client checks are UX only; the backend
  independently requires the live local Owner role AND Members.Read.
- Entry points are available from the Tenant Members heading and from
  each member row only while `canViewMemberAudit` is true. They never
  expand the static Tenant sidebar or bypass the permission-bound PAGE.
- `TenantWorkspaceService.getMemberAudit` sends GET with `page` and
  optional `memberId`, never TenantId or actor.
- The read-only component displays the existing lifecycle and direct
  member-role audit records with Jalali/Persian timestamps, paging,
  per-member filtering, empty states, loading/retry, and 401/403/404
  access-denied handling that clears existing entries.
- No plaintext initial password, token, invitation digest, email or
  user credential is present in the server response or UI. Current
  usernames may change; the actor/target GUID remains the durable
  identifier when a user is deleted. There is no mutation form.
- No new Feature Registry key, grant, migration or deployment setting.
  This is not a claim of Staging/Production readiness.

Tests: `tenant-member-audit.spec.ts`,
`tenant-admin-directory.spec.ts` and
`tenant-workspace.service.spec.ts`.
