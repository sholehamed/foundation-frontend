# FR-11A — Permission-backed Tenant PAGE navigation

2026-11-08. Companion to Backend FR-11A and the previously merged FR-10A.

- GET `/tenant/workspace/ui-access/me` yields a live `{entries:[{key,kind,route,allowed}]}` snapshot for the current tenant. The UI only recognizes exact `TENANT.MEMBERS.READ`, `TENANT.ROLES.READ`, `TENANT.GROUPS.READ` PAGE descriptors and matching routes.
- /dashboard/members, /dashboard/roles and /dashboard/groups retain tenantSessionGuard plus a per-page `tenantOwnerDirectoryGuard` (name kept for compatibility). The guard now looks for the **matching** permission and route. It does not use a broad Owner boolean and fails closed on missing/invalid snapshot.
- The tenant layout shows each admin link independently if the PAGE descriptor is allowed. A denied group permission no longer reveals a groups link merely because the actor can view members.
- Branch add/edit continues to use `admin-capabilities.canManageBranches`; Backend now derives it from the same effective Branches.Manage ACTION key AND writable tenant scope, checks again per POST/PUT. No browser-controlled TenantId.
- UI state is presentation only. **Every** protected backend API reevaluates its own permission; a stale menu or intercepted request cannot override it.

Security: UserPermission direct deny beats role/group and legacy Owner. Only active local tenant user/role/group and matching tenant assignment count; system and foreign tenant links do not. Legacy active Owner fallback keeps previously deployed pages usable. No DB grant seeding, production migration, permission assignment screen, paid subscription changes, BFF mode switch or application of registry to target SQL. Grant/apply safety process and browser E2E remain open under issue #44.
