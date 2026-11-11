## FR-17C-3A — Tenant active subscription PlanVersion allowances (2026-11-11)

- Added standalone Angular `TenantPlanAllowancesComponent` under Tenant dashboard **only for verified active commercial entitlement** from existing `/subscription/me`. Displays server-resolved Feature booleans, finite including 0, explicit Unlimited, and AllowedModes. Does not display or guess actual current usage/remaining capacity because no authoritative usage read API exists yet. No frontend role/permission grant or client-side paywall.
- Tests for zero vs Unlimited, inactive features, modes and empty capability list. Existing Tenant subscription status and coupon order paths remain unchanged. [Handoff](development/FR-17C3A-PLAN-ALLOWANCES-ANGULAR.md). Next backend usage projection with authenticated tenant scope, then a genuine consumption meter UI.

## FR-17E-1 — Dynamic coupons and zero-total Tenant checkout UI (2026-11-11)

- [PR #65](https://github.com/sholehamed/foundation-frontend/pull/65): System PlanCatalog page issues centrally generated percentage/FixedIRR coupon codes with validity days, total/per-Tenant settled limits and optional pinned published PlanVersion; plaintext secret shown exactly once at issuance, server stores hash only; lists settled usage/disable state. Existing Tenant order form supports optional coupon code and never transmits a client discount/net/tenant ID/payment flag; distinguishes confirmed `zero_total_settled_and_activated` from an unpaid partially discounted Pending Order. [UI handoff](development/FR-17E1-COUPONS-CHECKOUT-UI.md).
- Must deploy [Backend PR #138](https://github.com/sholehamed/foundation-backend/pull/138) and migration/central `PLAN-CATALOG.COUPONS` permission before UI. No real Commercial Module registered yet, so no actual published Plan order can be fabricated. Coupon is not a user Permission. Staging, refunds, renewal, accounting and payment gateway remain independent.

## FR-17C-2A — Owner Order form and central external-payment review (2026-11-11)

- [PR #64](https://github.com/sholehamed/foundation-frontend/pull/64) adds lazily loaded Tenant Owner order form from shared PublicPlanCards, typed server-priced Pending Order POST with no caller TenantId/amount/discount/payment flags, and own order list. Existing System PlanCatalog page includes a manual receipt review panel and sends an explicit external-payment attestation to the new backend System-only endpoint; no bank verification or coupon redemption is claimed. [Implementation/UI workflow](development/FR-17C2A-PLAN-ORDER-ANGULAR.md).
- Depends on [backend PR #135](https://github.com/sholehamed/foundation-backend/pull/135) and reviewed existing-db SuperAdmin `PLAN-CATALOG.SETTLE` permission rollout. Production source manifest has zero Commercial Modules, so UI must show no purchasable plans. No role grant, subscription activation before settlement, 100% coupon, gateway, quota or commercial runtime entitlement gating.

## FR-17C-1 — Truthful tenant commercial subscription shadow (2026-11-11)

- [PR #63](https://github.com/sholehamed/foundation-frontend/pull/63) replaces the hard-coded Tenant Dashboard pending activation message with read-only `TenantWorkspaceService.getSubscriptionShadow()` and `TenantCommercialEntitlementSnapshot` API. Only the backend active-Tenant context chooses the licensed Tenant; no TenantId/query/write input, no role/permission/menu change and no fake active plan from signup intent. New HTTP contract and pending/no-subscription UI tests. [Handoff](development/FR-17C1-TENANT-SUBSCRIPTION-STATUS.md).
- Requires [backend PR #134](https://github.com/sholehamed/foundation-backend/pull/134) and applied SQL migration; the dashboard safely shows a fetch error before it deploys. **No checkout/coupon/active paid license issuance/permission gating** is implemented. Commercial code registry still has zero modules.

## FR-17B-2C — Published Plan locks in System Admin UI (2026-11-11)

- [PR #62](https://github.com/sholehamed/foundation-frontend/pull/62) visibly distinguishes SQL-immutable Published Plan revisions from editable Drafts. Published-only rows show a lock and the **نسخه جدید** action; no published-content editor or false subscription activation. [Details and rollout](development/FR-17B2C-PUBLISHED-PLAN-LOCK-UI.md).
- Deploy matching backend [PR #132](https://github.com/sholehamed/foundation-backend/pull/132) SQL migration and EF trigger metadata before relying on DB integrity. Existing System Admin central grants, commercial Module registration, Subscription, discounts, quotas, actual payments and staging verification are independent prerequisites.

## FR-17B-2B — Plan Catalog administration in Angular (2026-11-10)

- [PR #61](https://github.com/sholehamed/foundation-frontend/pull/61) adds lazy `/system/plan-catalog` page as 14th centrally guarded System feature, typed `SystemPlanCatalogService`, RTL Plan listing, versioned Draft creation/edit/revision, source-approved Commercial Modules, price options in IRR, dynamic PlanCard display rows, read-only SHA-256 Publish Preview and Publish action enabled **only** when `canPublish` is true. [UI handoff and rollout](development/FR-17B2B-SYSTEM-PLAN-CATALOG-UI.md).
- Backend [PR #131](https://github.com/sholehamed/foundation-backend/pull/131) must deploy first and new permissions/menu reconciled on existing databases; existing revoked grants remain revoked. No Commercial Module is registered as shipped, so UI may create drafts but must block publication. No real Subscription/entitlement/payment or coupon validation. Angular CI and independent Browser/SQL/HTTP smoke required before production claims.

## FR-17B-2A — Dynamic public plans and signup UI (2026-11-10)

- Angular landing cards and signup step 1 now use the **same** `PublicPlansService` + `GET /api/public/plans`: DB-published title, features, badge and IRR currency rather than hard-coded prices. Unknown URL plan does not auto-select a different plan, missing cycle is not fake-priced, and empty catalog supports explicit `unselected` registration with **no active paid subscription**.
- [Implementation, tests and backend dependency](development/FR-17B2A-DYNAMIC-PUBLIC-PLANS-UI.md). Includes shared service, landing and signup unit tests. Backend companion still needs merged/deployed public endpoint; no live staging smoke or paid Billing. System/Tenant dynamic menu flags unchanged.

## FR-14C — System Admin consolidated central access operator gate (2026-11-10)

- Feature Registry cockpit now calls read-only System-owned `GET /system/FeatureRegistry/central-access/readiness` alongside the existing System Registry/manifest, Tenant Catalog, six Tenant routes and runtime Endpoint integrity diagnostics. Renders the four checks, blocker IDs and explicit warning when independently sampled fingerprints differ.
- `centralCatalogReady()` now requires a **consistent backend four-way aggregate** and matching live System/Tenant Preview fingerprints plus current executable Angular manifest verification. Any 401/403/network error, stale fingerprint or individual read failure clears aggregate and fails closed; no automatic Apply or sidebar enablement was introduced.
- Backend companion: `FR-14C consolidated central access gate`. Tests cover read-only GET without caller-selected tenant IDs, all-four/fingerprint state, and denial and refresh scenarios. **Not a Staging/Production approval**; global Menu definitions remain System Admin-only and Angular Tenant dynamic sidebar remains default OFF.

## FR-14C — System Registry fingerprint-approved Apply UI (2026-11-10)

- Updated System Admin Feature Registry client to require a valid 64-hex Backend Preview fingerprint and explicitly confirmed POST `{ fingerprint }`. Missing/malformed token or Angular Manifest mismatch cannot submit; server 403/409 invalidates stale preview and success reloads central reports.
- Companion Backend PR #113 enforces live SuperAdmin + serializable SQL recheck. Defaults OFF; no automatic definitions/grants/flags, no Staging or Production action. [UI contract](development/FR-14C-SYSTEM-REGISTRY-REVIEWED-APPLY-UI.md).
- Next: verify both repos on green main, review central operator catalog/menu/endpoint readiness on an approved target before enabling dynamic Tenant navigation.

## FR-14C — manual System Admin Tenant catalog Apply (2026-11-10)

- The read-only central readiness screen now exposes an **explicit confirm-only** Tenant Permission Catalog Apply for the exact 64-character SQL preview fingerprint. It uses the code-owned System feature ACTION check where enabled, while the API always enforces live System SuperAdmin, default-OFF server Apply gate, serializable fingerprint and no automatic grants. Invalid/stale 403/409 responses clear the preview and require a new GET.
- Typed POST contract and component confirmation/error tests added; no menu authoring by Tenant, automatic apply, operational configuration, database migration or deployment. [Operator guide](development/FR-14C-CENTRAL-OPERATOR-READINESS-UI.md).
- Next: actual isolated Staging operator review and two-Tenant browser permission/navigation certification before any pilot enablement.

## FR-14C — System Admin central readiness cockpit (2026-11-10)

- Existing System Feature Registry page now displays independently fetched read-only Tenant Permission Catalog Preview, central Tenant Menu readiness and live System Endpoint/API/Resource/Permission integrity. An overall catalog-ready indicator fails closed on missing/forbidden/partial responses, pending or conflicting System/Tenant catalogs and Angular manifest drift; it is NOT a release or authorization decision.
- Fixed no-parameter GET contracts, explicit invalidation on refresh and tests for forbidden diagnostics, pending records and all-clear requirements. No Tenant menu authoring, Registry Apply automation, grants, flags, migrations or deployment. [Operator contract](development/FR-14C-CENTRAL-OPERATOR-READINESS-UI.md).
- Next: disposable real HTTPS + SQL + Chromium integration extension, audited Staging/Deployment preflight and explicit operator approval before activating the independently default-OFF dynamic sidebar.

## FR-14C — central Menu authority correction (2026-11-10)

- User-confirmed business rule: System Admin owns all Menu/Category/Page/Resource/Action/Endpoint and permission definitions. Tenant Owner can assign permitted capabilities to roles/users, never author menus. Removed FR-14C-2B Tenant menu editor route/form/client/flag and their tests; kept FR-14C-1 read-only server-filtered central Menu navigation (pilot remains OFF).
- Backend companion removes Tenant menu tables/migrations, owner write APIs, and NAVIGATION.READ/MANAGE definitions. Earlier PRs are **historical, superseded**. Before deployment, inspect database migration history and preserve any local audit data; do not assume sources erase applied migrations.
- Next: verify central System Admin Registry and Tenant permission/grant bounds; test read-only dynamic sidebar and branch-level RBAC. Staging/Production unchanged.

## FR-14C-2B — Tenant Owner navigation editor UI (2026-11-09)

- Added disabled-by-default /dashboard/navigation settings page, live PAGE guard and Owner-only CRUD client for Tenant-owned categories and items: ordering, parent changes, soft-disable, exact safe route selection and CAS 409 reload. The separate settings link is shown only with live TENANT.NAVIGATION.READ and pilot flag.
- Development, production and Chromium profiles keep tenantNavigationEditorPilotEnabled OFF. Backend PR #101 adds Owner-authorized audit/CAS API and pending audit migration. Unit requests test absence of TenantId, grants and unsafe fields. [UX/rollout contract](development/FR-14C2B-TENANT-NAVIGATION-OWNER-UI.md).
- Still open: new-editor positive browser E2E, approved Migration+Permission Catalog Apply, legacy import, non-Owner delegation and branch-scoped RBAC. Staging/Production deferred.

## FR-14C-1 — Tenant dynamic navigation pilot (2026-11-09)

- Typed read-only `/tenant/workspace/navigation/me` client and recursive Tenant menu renderer added. The workspace layout uses the server-only tree when independent `tenantDynamicNavigationPilotEnabled` is ON and never falls back to privileged static links when the request fails. All dev/prod/Chromium environments keep it **OFF**.
- Backend companion requires live Tenant PAGE permissions for privileged Admin roots, rejects foreign/synthetic RoleScope and unknown routes. Tests cover response contract, recursion, external-link safety and disabled rollout; no Tenant/menu ownership migration or branches/delegation is claimed. [Scope and acceptance](development/FR-14C1-TENANT-DYNAMIC-NAVIGATION-UI.md).
- **Next:** explicitly Tenant-owned Menu definitions and branch membership/delegation, plus browser certification after approved migration/grants. Staging deferred.

## FR-14B-3 — System lifecycle UI (2026-11-09)

- New CAS-versioned System Admin profile/state/lock editor, behind BOTH default-OFF systemAccountLifecycleUiEnabled and systemUiAccessPilotEnabled. Requests carry only allowed fields and expectedVersion, and 409 requires explicit reload. No password, TenantId, role or permission edit UI.
- Legacy Admin create route is explicitly denied, legacy blind state/lock toggles removed from the list, and backend-only reserved SuperAdmin protections remain authoritative. Companion backend PR #98 adds guarded SQL/Audit APIs and a **not deployed** migration.
- CI covers strict client request contracts, guards, Angular validation and Chromium BFF regression. [Security/rollout contract](development/FR-14B3-SYSTEM-ACCOUNT-LIFECYCLE-UI.md). Staging/Production still deferred.

## FR-14B-2B — System Login initial-password challenge (2026-11-09)

- Existing System sign-in form now supports default-OFF, exact-root HTTPS System initial credentials and forced password change. Server response is a one-time restricted SQL challenge, never an authenticated session; the browser stores no proof outside component memory and redirects to **fresh** System login after the password is set.
- System login normal path and Tenant first-login remain unchanged when pilot is OFF. No admin issuance/edit UI is enabled; backend companion PR #97 adds the restricted API and unapplied SQL migration. [Security, tests and rollout boundaries](development/FR-14B2B-SYSTEM-FIRST-LOGIN-UI.md).

## FR-14A — authorization security inventory and route guards (2026-11-09)

- Added `src/app/security/fr14a-route-coverage.spec.ts`: all 13 System root features must remain under `systemSessionGuard` and shared opt-in `systemAllUiAccessGuard`, with no unauthorized root route; Tenant Admin routes must retain tenant-session and live PAGE guards, sensitive audit/member effective permissions/group pages retain independent Owner/dual-PAGE guards. Default-OFF BFF, System UI granular pilot and first-login flags asserted in both build profiles.
- Companion backend PR #94 adds an actual opt-in per-feature endpoint live grant requirement and an offline self-checking API registration inventory with CI artifact; no new grants, SQL migrations, Staging operations or feature flag enablement. Existing System Administrator and Tenant Owner policies remain authoritative.
- [FR-14A scope, report and explicit debt](development/FR-14A-ANGULAR-AUTHORIZATION-BOUNDARIES.md). Remaining unsafe System User/Admin mutations, distributed BFF, endpoint-specific Tenant policies and operational rollout belong to separately gated FR-14B/14C and BFF-05/06.

## FR-13C-2E — effective Tenant member permission explanations (2026-11-09)

- Added Owner-only guarded route `/dashboard/members/:id/effective-permissions`, conditional directory link, RTL Persian source-chain display and all/allowed/denied filter. It displays the authoritative live Tenant permission result and source evidence (direct allow/deny, UserRole, GroupRole, legacy Owner). No grant edits, credentials or TenantId requests.
- Read-only catalog report explicitly warns that an effective ACTION permission is not sufficient for privileged API operations with Owner/writable/target-specific gates. 403 clears stale report and disables reload. [Contract](development/FR-13C2E-TENANT-MEMBER-EFFECTIVE-PERMISSIONS-UI.md).
- Companion backend PR #93; no staging or production deployment. Next: separately reviewed endpoint-eligibility explanation, not inferred from catalog grants.

## FR-13C-2D — Tenant Group security history (2026-11-09)

- Read-only `/dashboard/groups/:id/audit` displays append-only Group lifecycle, membership and role changes with Jalali dates and bounded paging, plus historical link integrity counters. Owner can navigate only when live `canViewGroupAudit` capability is true; endpoint rechecks Owner + Groups/Members/Roles reads.
- Unattributed legacy link means **no matching grant entry found**, not proof of abuse; UI does not edit/delete historical data. 401/403/404 clears state, 20-row pagination and strict response validation. [UI contract](development/FR-13C2D-GROUP-SECURITY-REVIEW-UI.md). Next: human-reviewed reconciliation design.
- Staging/Production deployment and DB/Registry Apply remain deferred.

## FR-13C-2C — Group Role assignments (2026-11-09)

- Added `/dashboard/groups/:id/roles` with separate Groups+Roles live PAGE checks, 20-row ordinary role list and Owner-only single GroupRole confirmation. No bulk replacement, no Owner/System roles, inactive target additions prohibited. 409 reloads and requires re-confirmation; 403 clears stale state.
- Companion backend uses explicit `TENANT.GROUPS.ASSIGN-ROLES` ACTION, CASed SQL group version, target-bound intent and append-only audit. [UI contract](development/FR-13C2C-TENANT-GROUP-ROLE-UI.md). No Staging; release migrations/catalog are independent.

## FR-13C-2B — Tenant Group members (2026-11-09)

- Added `/dashboard/groups/:id/members`, guarded by live Groups+Members PAGE checks, with a paginated list of eligible ordinary members and an explicit per-user add/revoke confirmation. Only server-authorized Owners get write actions; no bulk replacement of a partial page, no TenantId from UI. 403 clears data; 409 reloads version and requires reconfirmation; inactive groups disallow new membership.
- Companion backend: explicitly registered owner-only `TENANT.GROUPS.ASSIGN-MEMBERS`, Group-version CAS and immutable per-user audit. [UI contract](development/FR-13C2B-TENANT-GROUP-MEMBERS-UI.md). Next: independently audited GroupRole linking. Staging deferred.

## FR-13C-2A — Tenant Group management UI (2026-11-09)

- Existing `/dashboard/groups` PAGE loads a dedicated Persian Group CRUD/state editor: per-ACTION Owner capabilities, name/description validation, SQL RowVersion, explicit confirmation for status changes, fail closed on 403/404 and refresh on 409. No GroupRole/UserGroup mutation is exposed until secure backend grant intents land. [Frontend contract](development/FR-13C2A-TENANT-GROUP-LIFECYCLE-UI.md). No Staging/Production rollout.

## FR-13C-1 — Tenant Owner audit page (2026-11-09)

- Added a read-only Persian/Jalali `/dashboard/member-audit` page and optional per-member filter. Entry links appear only when the live server says `canViewMemberAudit`; routing checks both the existing Members PAGE permission and a fresh Owner capability. Backend rechecks permission per GET; 401/403 clears history. Pagination, empty/error/retry states and contract tests included.
- No extra sidebar item, new catalog permission, secrets, staging rollout or production flag changes. [UI contract](development/FR-13C1-TENANT-MEMBER-AUDIT-UI.md); backend SQL implementation/release approval remains independently required.

## FR-13B-3A — staff without an email (2026-11-09)

- Tenant Owner member form and API DTO permit `email:null`, and only show email invitation for staff with an actual email. Missing email uses visible `بدون ایمیل` label; owner may create and issue one-time password atomically, with unchanged permission, CAPTCHA/login, challenge and security gates. Angular unit regression covers this path and prevents phantom email invitations.
- Requires Backend [Issue #78](https://github.com/sholehamed/foundation-backend/issues/78) SQL nullable email migration, manual reviewed rollout and the existing opt-in first-login Owner grants. No Production or Staging rollout, flag enablement or real SMTP provisioned by code merge. [Detailed contract](development/FR-13B3A-EMAILLESS-STAFF-UI.md).

## FR-13B-3C — mandatory first-password change on BFF Identity Login (2026-11-09)

- Existing Identity-host Tenant login now distinguishes normal 204 Identity Cookie from a strictly validated 200 `password_change_required` challenge. The same sign-in form displays change-password in place, invokes Identity XSRF-protected change-only completion and requires explicit re-login before validated local OIDC continuation. No duplicate login choice, no token storage or BFF application session for a temporary credential. Existing direct Tenant and System flows remain unchanged.
- Companion [Backend Issue #81](https://github.com/sholehamed/foundation-backend/issues/81), [implementation/security contract](development/FR-13B3C-IDENTITY-BFF-LOGIN-UI.md). Both feature flags OFF by default; no Staging/Production enablement or hosted end-to-end certification, and employee email still mandatory until #78.

## FR-13B-3B — standard Tenant Login auto force-password change (2026-11-09)

- Existing Tenant Login now automatically performs server decision for generated-format temporary credentials; ordinary passwords use previous AuthService login unchanged. Verified temporary credential switches same Login UI into forced password change using only transient 10-minute change-only challenge; completion does not create app auth session and returns to fresh Login.
- Owner member creation can atomically request initial password in same write when both live permissions and default-OFF `tenantFirstLoginEnabled` allow it; one-time reveal existing panel. No auto grants, no email/SMTP requirements for initial credential delivery, though User.Email remains mandatory at creation (#78).
- [Frontend contract](development/FR-13B3B-UNIFIED-LOGIN-UX.md), backend [Issue #79](https://github.com/sholehamed/foundation-backend/issues/79). Legacy external Identity-host BFF pilot still needs explicit cross-origin/OIDC design; do not assume parity. No Staging/deployment or feature toggles are enabled by merge.

## FR-13B-3 — first-login / compulsory password change (2026-11-09)

- Backend companion [PR #77](https://github.com/sholehamed/foundation-backend/pull/77), [Issue #76](https://github.com/sholehamed/foundation-backend/issues/76). Default-OFF Angular `tenantFirstLoginEnabled` gates a one-time Owner temporary-password issuance/reveal in Tenant directory and a new public `/auth/first-login` restricted proof/change form, separate from native OAuth/BFF and SMTP invitation flows.
- Employee exchanges initial password only for a 10-minute, single-purpose password-change challenge **without** a normal session. `fetch` credentials omit, same-origin HTTPS, no redirects; secret remains transient in component memory and gets cleared after use. On success explicitly returns to ordinary login and must reauthenticate with new password.
- All Backend rollout and account activation are fail-closed on missing approved SQL migration/catalog/grants/toggle. No live Staging, SMTP setup or Production change in this UI PR. [Full UI contract](development/FR-13B3-FIRST-LOGIN-UI.md).

## FR-13B-2 — one-time invitation and activation UI (2026-11-09)

- Backend companion [PR #75](https://github.com/sholehamed/foundation-backend/pull/75), Issue [#74](https://github.com/sholehamed/foundation-backend/issues/74). Tenant members directory now has live `canInviteMembers` capability and sends invitation requests for inactive members only. No Owner-visible token; SMTP response `submitted` is not proof of inbox delivery.
- Public `/auth/activate` page consumes link token from a URL fragment captured/erased **before Angular bootstrap**, only transient memory; validates exact Tenant host, insists on same-origin API, uses credential-omitting, no-redirect, same-origin fetch activation with strong new password and clears secrets. Backend owns hash, TTL, one-time SQL consumption and audit.
- Full deployment requires approved SQL migrations, manual Tenant Registry Preview/Apply and Owner grant, properly configured SMTP, same-origin HTTPS Tenant proxy; none are enabled by a code merge. A functioning Staging SMTP delivery and complete two-user Chromium acceptance remain future work.
- [Design and test contract](development/FR-13B2-TENANT-INVITATION-ACTIVATION-UI.md).

## FR-13B-1 — Tenant inactive member creation UI (2026-11-09)

- Added a server-capability-gated form on the existing /dashboard/members page. POST only {userName,email,firstName,lastName}; never client TenantId/role/password/active status. Rechecks canViewMembers+canCreateMembers immediately before write; 401/403/404 clears local rows and create permission.
- This creates **inactive**, non-login employee records only, not invitations. No email/token, password activation or auto grants. Backend [PR #73](https://github.com/sholehamed/foundation-backend/pull/73) requires reviewed SQL audit migration and manual Tenant catalog Apply; both repos' CI must pass before respective merges.
- [UI contract and limitations](development/FR-13B1-TENANT-INACTIVE-MEMBER-UI.md). Parent [FR-13](https://github.com/sholehamed/foundation-backend/issues/70).

# Foundation Frontend — project state and handoff

## FR-08B — Tenant Admin read-only workspace starter (2026-11-08)

- PR/CI pending: [FR-08B tenant workspace pages](development/FR-08B-TENANT-WORKSPACE.md), Backend PR #51. /dashboard still follows tenant login but now has a scoped shell and read-only business/branches child pages, each guarded by tenantSessionGuard. Only current tenant-owned data is requested; no tenant IDs sent from Angular.
- Shared TenantWorkspaceService and present loading/empty/error/retry support. No TenantAdministrator role policy or mutating pages yet. No billing claim or BFF rollout. Follow-up will define Tenant Admin/employee/branch read/write scopes before changes.


## FR-08A — System landing dashboard, real metrics (2026-11-08)

- PR/CI pending: [System dashboard implementation](development/FR-08A-SYSTEM-DASHBOARD.md), companion Backend PR #50. /system/dashboard now renders actual business tenant activity, account/roles/permissions/modules/groups counters, six recent businesses and permission-aware navigation, with loading/error/retry and empty states. Historical Roles counter bug fixed. System login path remains /system/dashboard.
- Tenant Admin remains a separate, tenant-scoped FR-08B effort; current /dashboard is an initial read-only workspace view. No BFF, grants, client access enforcement switch or SQL changes.


## FR-07B — System-wide live UI access guard and shared snapshot (2026-11-08)

- **PR/CI gate:** [FR-07B System UI runbook](development/FR-07B-ALL-SYSTEM-UI-GUARDS.md), Backend [PR #49](https://github.com/sholehamed/foundation-backend/pull/49). Single no-store UI snapshot per navigation for 45 PAGEs / 35 ACTIONs. `canActivateChild` checks all executable System leaf routes from Angular path templates and denies unrecognized/disabled routes to a dedicated unprotected-from-loop access-denied page.
- Reusable `*systemCan` directive applied to main System lists and CRUD, state, nested Resource and actual Menu/Group/Registry actions. Sensitive mutations re-evaluate the ACTION decision on click. One HTTP request is shared by guard and presentation per navigation; no caller role/tenant IDs or token grant claims.
- **Default OFF**: `systemUiAccessPilotEnabled=false` in all environments pending reviewed Registry Apply and explicit Master-scope grants. This code is UI only, not server-side granular API enforcement; BFF/auth/production SQL unaffected.
- Dead Angular navigation links identified in Groups and Tenants were corrected/hidden; details and rollout/test constraints are in the runbook.


## FR-06B — live System UI access Guard and Save pilot (2026-11-07)

- **PR/CI gate:** [FR-06B runbook](development/FR-06B-LIVE-UI-ACCESS-PILOT.md), Backend [PR #48](https://github.com/sholehamed/foundation-backend/pull/48). Angular `SystemUiAccessService` checks one code-owned key via live `UiAccess/me/{key}` and fails closed on error/mismatched response.
- First System UI pilot: `/system/roles/:roleId/permissions` route Guard, Roles list menu visibility and Role Permissions Save with a **fresh click-time** ACTION check. `systemUiAccessPilotEnabled` is **false in every environment by default** to preserve existing administrator workflows until catalog/role grants are reviewed and deployed.
- This is UI behavior, **not** API authorization: existing SystemAdministrator and separately opt-in granular API role permission checks stay unchanged. No BFF, production database or grants touched. Endpoint catalog and role write-backend safety remain authoritative.


## FR-05B — runtime nested PAGE compatibility and Registry manifest v2 (2026-11-07)

- **Frontend implementation / CI gate:** [FR-05B handoff](development/FR-05B-NESTED-UI-ROUTES.md), Backend [PR #47](https://github.com/sholehamed/foundation-backend/pull/47). The Registry review page now loads the **actual lazy Angular route configurations** (default-export aware), enumerates 32 executable child PAGE templates and compares them to Backend schemaVersion=2 `uiElements` (32 PAGE + 9 ACTION descriptors) alongside the 13 root features.
- No second production list of nested routes or backend Permission.Code is maintained. Missing/extra routes, malformed UI ownership/permission/Type, duplicate entries, unsafe action URL, old manifest or lazy import errors block the UI Apply action.
- Does not enforce protected APIs or route components and does not change BFF, grant assignments or Sidebar. Backend Apply still requires SystemAdministrator and default-OFF deployment flag. Admin/User forms are deliberately inactive in the Backend catalog pending safety review.


## FR-03B-2 — complete System executable-route coverage (2026-11-07)

- **Frontend implementation / CI gate:** [FR-03B-2 runbook](development/FR-03B2-SYSTEM-ROUTES.md) and [Backend PR #46](https://github.com/sholehamed/foundation-backend/pull/46). All 13 actual root System routes now share a route-only index; no duplicated backend-owned keys or read permission codes. Vitest checks the entire `system.routes.ts` root page set exactly matches the index, preventing a forgotten page.
- The privileged Registry admin page continues to validate the full backend schemaVersion=1 feature manifest against these Angular paths before offering Apply. No login/BFF/permission-enforcement/role grant changes. Existing legacy menu entries and database state remain untouched until explicitly reviewed Apply; CI unit tests are not production SQL cert.


## FR-03B-1 — backend-owned manifest and Angular route compatibility (2026-11-07)

- **PR / CI gate:** [FR-03B-1 handoff](development/FR-03B1-BACKEND-MANIFEST-VALIDATION.md); paired backend [PR #45](https://github.com/sholehamed/foundation-backend/pull/45). Angular no longer duplicates the stable Feature.Key or Permission.Code in its production route definitions; the code-owned System route index contains only executable route segments for Users, Roles and Permissions.
- `/system/feature-registry` now loads authoritative `GET /system/FeatureRegistry/manifest` alongside read-only Preview. Runtime schema/route/metadata validation must pass for the button to call POST Apply. Unknown routes/schema versions, missing backend manifest, preview conflicts or failed calls fail closed. **This is an admin UI compatibility gate**, not an API authorization decision or a cross-repo build contract.
- No auth token/BFF change, no automatic role grants, no new Angular executable routes from DB. The backend default-off Apply flag remains authoritative; SQL production inventory and cross-repo CI version contract remain open.


## FR-03A — code-owned System feature manifest and admin Registry UI (2026-11-07)

- **PR / CI gate:** [FR-03A guide](development/FR-03A-FEATURE-REGISTRY-UI.md), companion [Backend FR-02A PR #43](https://github.com/sholehamed/foundation-backend/pull/43). A typed manifest supplies stable feature keys and actual System Roles/Permissions route metadata, checked by Vitest against the Router configuration.
- New `/system/feature-registry` review page displays Backend read-only Preview differences and supports explicit confirmed Apply (Backend must have `Identity:FeatureRegistry:EnableApply=true`); 403/409 and empty/error states never trigger writes or fabricate privileges. Menu Administration links to the Registry page.
- **Limitations:** only Roles/Permissions first vertical, no automatic cross-repo build artifact exchange, permission-based Angular route guard or arbitrary DB-driven route components, no automatically assigned grants or auto-enabled backend apply. No BFF, Password Grant, token-storage or current-user Sidebar change.


## FR-04B — authenticated dynamic Sidebar (2026-11-07)

- **PR / CI gate:** [FR-04B frontend handoff](development/FR-04B-CURRENT-USER-SIDEBAR.md), backend [FR-04A PR #42](https://github.com/sholehamed/foundation-backend/pull/42). Sidebar loads `GET /system/Menus/me` once, no client role selector, recursively renders all levels, handles empty/error without hardcoded privileged links and retains optional tenant logo handling. Unit tests cover HTTP contract, empty/error/retry, nested links and HTTPS external URLs.
- **Deployment dependency:** backend FR-04A must ship first/atomically; production Menu data is **not seeded** by default. Without configured MenuCategory/Menu rows and explicit grants, UI correctly shows 'no configured menu'. No new route components or permissions are dynamically instantiated from DB.
- **Not complete:** official feature manifest and route guards, live DB catalog inventory, TenantPermissionRestriction scope rules and BFF browser migration.


## Feature Registry FR-01A — menu tree adapter (2026-11-07)

- Backend [FR-00 PR #38](https://github.com/sholehamed/foundation-backend/pull/38) merged: menu update targets the Menu entity and canonicalizes update request fields.
- Backend [FR-01A PR #40](https://github.com/sholehamed/foundation-backend/pull/40) adds canonical Menu response fields, retains old read aliases and provides a read-only SQL catalog inventory. Pending CI/review, not a completed auto-registration system.
- The admin menu editor consumes a **flat** `GET /system/MenuCategories/{categoryId}/menus` response while its Material tree previously assumed nested `children`. This frontend slice adds a pure, tested parentId-to-tree adapter that renders arbitrarily deep menu levels; orphan, cyclic, self-parent and cross-category links remain visible as roots for manual repair instead of crashing or disappearing. No server write/migration or authorization/menu-scope behavior changes.
- **Still open:** actual persisted-data catalog inventory, permission.Code vs Name contract, menu-parent integrity on writes, effective user-scoped navigation (currently roleId-based), removal of hardcoded System Sidebar fallbacks, BFF cutover. Keep separate reviewed PRs; do not treat hiding links as enforcement.


## Sidebar startup null Tenant fix — 2026-11-06

- System Dashboard intentionally has no TenantContext (`current === null`); the sidebar previously accessed `current!.logo!` unconditionally in `ngOnInit` and threw `Cannot read properties of null (reading 'logo')` before the first render.
- Sidebar now always initializes role/menu loading independently of branding. A tenant logo is optional: when no context/logo exists or media preview fails, it keeps `shinera-dark-logo.png`; a valid tenant logo still renders.
- The media request unsubscribes on component destruction, and object URLs are revoked when replaced or on teardown. Added isolated Angular TestBed regression tests covering System-host null, missing logo, preview error, success/cleanup.
- This does **not** touch Password Grant, BFF/Identity, TenantContext resolution or hamburger toggle behavior. Original F00 PR #2 remains untouched.


## Completed phase 1: Angular Identity UI + BFF contract v1 (2026-11-06)

- [Identity UI/BFF contract](architecture/identity-ui-bff-login-contract.md) fixes **one Angular build** hosted on app origins and a dedicated Identity-only HTTPS origin: same-origin CSRF+CAPTCHA+interactive-login, continuation back to OpenIddict Code+S256 PKCE, then BFF host-only cookie and future `/bff/session`. Backend canonical [protocol specification](https://github.com/sholehamed/foundation-backend/blob/main/docs/architecture/identity-ui-bff-login-contract.md).
- The new pure `tenant-workspace-host.ts` classifier (with Vitest coverage) prevents Identity/auth and reserved infrastructure hosts from initializing a Tenant context. A type-only `BffSessionResponse` contract captures the *actual* server JSON without changing legacy runtime authentication.
- **Only phase 1 complete:** Angular Password Grant/TokenStorage/bearer guards still work; BFF flag stays OFF. Actual browser/proxy, IdP SSO/refresh revocation, SQL HA/DP rotation, and BFF-06/07 production cutover remain separate pending work.


## Verified backend BFF SQL cleanup and local logout-all — frontend handoff (2026-11-06)

- Backend [PR #34](https://github.com/sholehamed/foundation-backend/pull/34) merged at `576b7941fada322fc32def221836ff211f469574`. SQL Server maintenance-only bounded cleanup now retains rows until 48h past absolute expiry; [CI #42218028623](https://github.com/sholehamed/foundation-backend/actions/runs/42218028623) green: **94 BFF + 60 Identity + 12 SQL Server**.
- Backend [PR #35](https://github.com/sholehamed/foundation-backend/pull/35) merged at `18775eeb80ea6740d37943b516060172290e882e`. New **POST /bff/auth/logout-all** requires BFF cookie, host check, same-origin and antiforgery; derives target OIDC GUID `sub` solely from verified server-side principal and atomically revokes all **existing SQL BFF sessions** for that account. SQL migration adds subject binding and explicitly revokes older unbound sessions during rollout. [CI #42219967286](https://github.com/sholehamed/foundation-backend/actions/runs/42219967286) green: **96 BFF + 60 Identity + 17 real SQL Server**.
- **Do not confuse local logout-all with complete Identity signout:** upstream access/refresh tokens, IdP SSO login cookie and new logins after revocation are **not** invalidated by this endpoint. [Security/migration handoff](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/BFF-05-4A-LOGOUT-ALL.md).
- Frontend runtime remains unchanged: legacy Password Grant/localStorage/bearer interceptors and route guards continue, BFF flag remains OFF by default. **BFF-06 Angular migration is still blocked** by IdP upstream revoke/refresh rotation, actual browser/proxy/SQL failover/keyring certification and OIDC callback race, plus BFF-07 legacy-flow cutover.
- Continue from [backend master #20](https://github.com/sholehamed/foundation-backend/issues/20), [frontend BFF-06 #10](https://github.com/sholehamed/foundation-frontend/issues/10). Both initial F00 PR #2 remain untouched.


## Backend SQL Server atomic BFF store merged — frontend handoff (2026-11-06)

- Backend [PR #32](https://github.com/sholehamed/foundation-backend/pull/32) merged as `c2ebf86053c17fb87309ec630f932ac32701a127`. [Final CI #42215944644](https://github.com/sholehamed/foundation-backend/actions/runs/42215944644) passed full solution build, **94 BFF + 60 Identity + 9 real disposable SQL Server tests** (163/163). This is actual code/SQL evidence, not just an atomic interface placeholder.
- Web-owned `SqlServerBffAtomicTicketStore` has SQL row-serialized renewal/revoke, 24h fixed absolute deadline, protected server-side Ticket, predeployed schema with startup integrity check, and real two-TestServer shared persisted keyring/SQL Cookie logout/restart replay test. See [technical SQL rollout and guarantees](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/BFF-05-5B-SQL-ATOMIC-SESSION.md).
- **Still NOT frontend migration-ready:** SQL failover and production keyring encryption/rotation, logout-all/upstream refresh-token revocation, concurrency-safe refresh rotation, OIDC callback race, actual browser HTTPS/reverse-proxy/SQL Server system+tenant E2E and BFF-07 legacy-client sign-off remain open. Backend BFF opt-in default `false`.
- All current Angular auth implementation remains intentionally **unchanged**: legacy Password Grant/localStorage/bearer interceptors/guards and session state. BFF-06 migration starts only after backend BFF-05 closure with verified browser tests and a rollout/rollback plan; no cross-origin wildcard credentials. Track [backend #20](https://github.com/sholehamed/foundation-backend/issues/20), [SQL cert #30](https://github.com/sholehamed/foundation-backend/issues/30), [frontend #10](https://github.com/sholehamed/foundation-frontend/issues/10). Original F00 PR #2 untouched.


## Backend session durability / atomic provider handoff — 2026-11-06

- [Backend PR #28](https://github.com/sholehamed/foundation-backend/pull/28) merged at `ccbaddcad3d8e7c413a505ba7c8e2e0a04e59298`, [CI #42210307369](https://github.com/sholehamed/foundation-backend/actions/runs/42210307369): **88 BFF + 60 Identity**. The BFF ticket store now has an original 24-hour max lifetime and 48-hour revocation tombstone to guard against concurrent logout/renewal on a consistent shared cache.
- [Backend PR #29](https://github.com/sholehamed/foundation-backend/pull/29) merged at `b9a6bb77cedcc55511f2d45edff28667b20f5734`, [CI #42211389822](https://github.com/sholehamed/foundation-backend/actions/runs/42211389822): **94 BFF + 60 Identity**. Staging/Production BFF startup now requires a registered singleton atomic session provider rather than treating bare `IDistributedCache` as sufficient.
- **The atomic SQL Server provider does not exist yet.** [Backend issue #30](https://github.com/sholehamed/foundation-backend/issues/30) tracks its transactional implementation, multihost concurrency/eviction/failover tests, shared Data Protection keys and deployment evidence. A DI marker is not a production security certification.
- Angular Password Grant, localStorage, bearer interceptors, route guards and in-memory Signals are unchanged. **Do not start BFF-06 client migration or remove legacy auth** until actual atomic provider, logout-all/upstream revocation, browser/SQL Server/proxy E2E and remaining session lifecycle gates are closed. `Identity:Bff:Enabled=false` remains default; both original F00 PRs stay open.
- Resume from [backend BFF-05 issue #20](https://github.com/sholehamed/foundation-backend/issues/20) and [frontend BFF-06 issue #10](https://github.com/sholehamed/foundation-frontend/issues/10).


## Backend real callback + live Identity validator — verified 2026-11-06

- Backend [PR #26](https://github.com/sholehamed/foundation-backend/pull/26) merged at `fa76eb952d99353d1f66e9249ec63cc6e9ef4e21` after [CI #42208199510](https://github.com/sholehamed/foundation-backend/actions/runs/42208199510): **82 BFF + 60 Identity** tests all passed. Actual Foundation OpenIddict callback and Web live Identity DB validator were exercised for System and Tenant in two TestServers.
- This verifies stamp-based invalidation and removal of stale BFF tickets, **not** browser BFF readiness. Distributed renewal/logout races, upstream revocation/logout-all, absolute/idle expiry, browser/SQL Server/reverse proxy and multi-instance acceptance remain open.
- Angular still uses legacy Password Grant, localStorage and bearer interceptors. No Auth/Guard/Signals migration until BFF-05 release gates and real browser E2E. BFF remains disabled by default.
- Track [backend #20](https://github.com/sholehamed/foundation-backend/issues/20) and [frontend #10](https://github.com/sholehamed/foundation-frontend/issues/10). Original F00 PR remains open.


## Backend BFF-05.3 verified handoff — 2026-11-06

- Backend [PR #23](https://github.com/sholehamed/foundation-backend/pull/23) merged current-session CSRF/bootstrap/logout at `88239b7d3454fd03b87aa7bc20e70d1a820b088a`.
- Backend [PR #24](https://github.com/sholehamed/foundation-backend/pull/24) merged Web-hosted live Identity validation at `a676919d0d7d777c2c72895c7e1c9a9cd7987aa7`. Final [CI #42206724851](https://github.com/sholehamed/foundation-backend/actions/runs/42206724851) passed **82 BFF and 58 Identity tests**, solution build green. The Web host now rechecks active user/Tenant/lockout, security-stamp and scoped grants against current DB on BFF cookie reads, using a server-only snapshot.
- This is **not browser migration acceptance**: OIDC callback with the Web adapter, stale-ticket renewal races, token revocation/logout-all, absolute/idle expiry, SQL Server, multi-instance cache/keyring and actual browser same-origin/proxy flows remain outstanding.
- Angular login, Signals session state, route guards and bearer interceptors remain on the existing legacy Password Grant / localStorage flow. Do **not** switch until the BFF-05 release gates and browser E2E are complete. Backend `Identity:Bff:Enabled` is disabled by default.
- Tracking: [backend issue #20](https://github.com/sholehamed/foundation-backend/issues/20), [frontend issue #10](https://github.com/sholehamed/foundation-frontend/issues/10). The original F00 PR stays open.


> Updated: 2026-11-06. Integration branch: `main`.
> Verify linked PR heads and CI before continuing. Earlier checkpoints remain in Git history.

## Current implementation

Angular still uses Password Grant, browser token storage and bearer interception for normal application login. Full BFF migration (BFF-06) has not started.

[Frontend PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) merged the separate, allowlisted Identity UI Authorization Code continuation. It uses same-origin CSRF and interactive login before navigating back to the authorization endpoint. [CI 42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581) passed 22 tests in 12 files and the development build. This does not migrate application guards or token storage.

## Backend dependency checkpoint

| Capability | Verified state |
| --- | --- |
| Protected server ticket, interactive Identity cookie, code + PKCE | Merged BFF-01 through BFF-03 |
| Actual Identity to BFF protocol flow | [PR #22](https://github.com/sholehamed/foundation-backend/pull/22) merged at `f53c5e04d899b09d33133f57beafe234b671501c`; two real TestServers with OpenIddict discovery, code exchange, UserInfo and host-bound cookie. [CI 42198862063](https://github.com/sholehamed/foundation-backend/actions/runs/42198862063): 58 BFF + 48 Identity tests |
| Read-only session | Merged [PR #19](https://github.com/sholehamed/foundation-backend/pull/19): cookie-only `GET /bff/session`, safe JSON, no-store, 401/403 |
| CSRF and current-session logout | [PR #23](https://github.com/sholehamed/foundation-backend/pull/23): `GET /bff/auth/csrf` and `POST /bff/auth/logout`; server ticket removal with host, Origin/Fetch Metadata and antiforgery validation. Check PR for current acceptance/merge status |
| Remaining lifecycle | Live user/tenant/stamp/grant revalidation, logout-all, upstream token revocation, idle/absolute lifetime and refresh coordination, durable multi-node cache/keyring |
| Browser/deployment acceptance | Actual browser, CAPTCHA/login UI, SQL Server and trusted reverse proxy still unverified |
| Angular BFF-06 | Blocked on lifecycle and browser acceptance; [issue #10](https://github.com/sholehamed/foundation-frontend/issues/10) |

The two-TestServer flow excludes the real password/CAPTCHA UI and browser cookie enforcement. Do not call it deployed browser E2E. BFF remains disabled by default.

## Accepted boundaries

- Complete useful pages and workflows before extracting Angular packages.
- Keep System Admin and Tenant Application identity and routing separate.
- Target browser auth uses a Secure/HttpOnly/host-only BFF cookie and server-held OAuth credentials.
- Angular and its BFF/API must share an exact origin; use relative `/bff/*` and `/api/*` behind a proxy.
- Do not enable global credentialed CORS or migrate existing login prematurely.
- Both original F00 PR #2s remain open by prior decision.

## Next implementation sequence

1. Backend: revalidate current user, active tenant, security stamp and grants at the cookie boundary with a defined maximum staleness; high-risk operations need fresh checks. Keep BFF and Identity module boundaries separate.
2. Backend: account-wide revocation, upstream token revocation, refresh coordination and bounded idle/absolute expiration. Test concurrent logout/renewal so a stale renewal cannot resurrect a removed ticket.
3. Deployment: durable shared cache/keyring, restart/outage behavior, trusted forwarded headers and SQL Server validation.
4. Frontend: gated Signals session facade, relative requests, CSRF bootstrap, contextual login and POST logout; separate 401 from 403.
5. Cross-repo browser tests for System/Tenant login, reload, logout, expiration and revocation; inspect browser storage and network for OAuth credential exposure.
6. Only after acceptance remove browser Password Grant, token storage and bearer interception; preserve native/service authentication.

## Existing files to migrate later

- `src/app/shared/services/auth.service.ts`
- `src/app/shared/services/token-storage.service.ts`
- `src/app/shared/interceptors/api-auth.interceptor.ts`
- `src/app/shared/guards/system-session.guard.ts`
- `src/app/shared/guards/tenant-session.guard.ts`
- `src/app/app.config.ts`
- `playwright.config.ts` and `e2e/`

## Continuity references

[Backend state](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md) · [Roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md) · [ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md) · [Browser client contract](architecture/browser-bff-client.md) · [Identity UI handoff](development/BFF-04-IDENTITY-UI-HANDOFF.md).

This documentation-only continuation does not change Angular runtime behavior. Read the current checkpoint before historical implementation notes.

- **Additional FR-07B verification:** System Sidebar now filters live menu rows by authorized registered PAGE routes in opt-in mode (no fallback), and CRUD state/lock/delete/API sync handlers recheck ACTIONs immediately before UI writes. [FR-07B runbook](development/FR-07B-ALL-SYSTEM-UI-GUARDS.md) details limitations. Flag remains OFF by default.
