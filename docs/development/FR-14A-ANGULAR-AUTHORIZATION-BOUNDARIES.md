# FR-14A — Angular route and security-surface audit

Date: 2026-11-09. This is a **route coverage regression**, not a claim that a frontend guard authorizes backend API calls.

## Executable route matrix

| Surface | Route family | Frontend boundary | Backend authority |
|---|---|---|---|
| System | 13 root pages + 32 executable nested PAGE routes | `systemSessionGuard` + `systemAllUiAccessGuard` on the common layout, dynamic `SystemUiAccessService` | All System admin endpoints retain live `SystemAdministrator`, and FR-14A binds an opt-in live per-metadata permission requirement to every registered `WithFeatureEndpoint` |
| Tenant workspace | `/dashboard`, `/business`, `/branches` | `tenantSessionGuard` inherited by each child | Tenant context, active scope, read-only or explicit Owner write checks per handler |
| Tenant Administration | `/dashboard/members`, `/roles`, `/groups` and related member-role, group-member, group-role, role-permission editors | Parent Tenant session plus `tenantOwnerDirectoryGuard` from live Tenant PAGE snapshot; backend still validates every target/write | Explicit reviewed Tenant PAGE/ACTION and local Owner gates, SQL CAS/append-only audit |
| Sensitive Tenant introspection | `member-audit`, member effective permissions, group audit/group-role/group-member page | Extra live Owner/dual-PAGE guards in addition to tenant session and directory guard | Server-side Owner, tenant scope, no-store; no frontend-only grant |
| Public login / provisioning | `/auth/**`, `/system/auth/login`, public routes | Intentionally outside admin layouts; no privileged session on temporary password | Distinct CAPTCHA/CSRF/rate-limit/OIDC/activation handlers, reviewed independently of System Feature Registry |
| System denial | `/system/access-denied` | Outside secured child layout to prevent infinite redirect loop | No privileged data |

## Preventing drift

New invariant spec `src/app/security/fr14a-route-coverage.spec.ts` fails when:
- System common parent loses `systemSessionGuard` or `systemAllUiAccessGuard`, or a feature route escapes the 13-code-owned root set.
- Tenant Admin common session guard or any admin child PAGE guard is removed, or sensitive history/provenance pages lose their independent capability guards.
- Default-OFF BFF, System UI pilot or first-login rollout flags are changed silently in either Angular environment.

Existing tests additionally discover the 32 actual lazy System child routes (rather than trusting only a hardcoded array) and compare them to the backend-owned Registry manifest before allowing an explicit reviewed Apply.

## Known and *not yet certified*

- `systemUiAccessPilotEnabled=false` in normal builds: System route-level granular checks are prepared but **inactive** until reviewed Registry/role grants. Current System access is still protected by server-side `SystemAdministrator`; it is **not** blanket granular API authorization.
- `bffTenantPilotEnabled=false`, `tenantFirstLoginEnabled=false` by default; legacy Angular Password Grant/browser token storage remains until BFF-05/06/07 security and deployment gates.
- Browser forms and System User/Admin create/edit require FR-14B dedicated backend business-contract fixes and positive browser CRUD E2E. This audit does not remove legacy routes or silently activate disabled actions.
- Tenant Menu Scope, Branch/Own/Child access and delegated non-Owner Tenant Admin are future FR-14C policy design. No automatic permission grants or catalog Apply.
- Every missing or unknown server requirement must fail closed when the reviewed rollout gate is enabled; screenshot/menu visibility alone must never be considered authorization.

**No Staging, Production, SQL catalog, feature toggle or deployment changes.**
