# FR-13C-2E — نمایش دسترسی مؤثر عضو (Angular)

Companion to [Backend FR-13C2E](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13C2E-TENANT-EFFECTIVE-PERMISSIONS.md).

- Read-only route `/dashboard/members/:id/effective-permissions`, linked from member directory only for live `canViewMemberEffectivePermissions`. Route uses existing Tenant-session and directory PAGE guards and a new fail-closed Owner-capability guard.
- The backend authoritatively checks live Owner and `MEMBERS.READ + ROLES.READ + GROUPS.READ`, derives TenantId, and evaluates every known Tenant PAGE/ACTION code for the **target user** using the existing evaluator. Frontend authorization is never authoritative.
- Lists `allowed`, `decision`, registration state and up to 20 candidate provenance links per permission; multiple sources may coexist. `direct_deny` overrides inherited grants; disabled accounts are denied. Persian explanations and RTL layout; filter all/allowed/denied runs locally.
- **Critical disclaimer:** permission `allowed` is only the raw Tenant workspace catalog evaluation. It is not a guarantee that a protected operation can execute. Write endpoints can additionally require Owner, writable Tenant scope, registered action/UI resource, feature flag and valid target.
- A 401/403/404 clears stale report data and stops retries. Broken target GUID or malformed response fails closed. No form, save, password, email, JWT, tenant switch, grant mutation or export.
- This phase does not inspect arbitrary Resource.Action codes or show system-level grants; it covers the explicit Tenant workspace catalog only. No additional menu item or static sidebar privileges.
- Tests: `tenant-member-effective-permissions.spec.ts`, `tenant-member-effective-permissions.guard.spec.ts`, `tenant-workspace.service.spec.ts`, `tenant-workspace.routes.spec.ts`; existing member directory tests preserved.
- **Release:** no staging deployment, no SQL migrations, no permission catalog Apply. Merging code does not authorize production rollout.
