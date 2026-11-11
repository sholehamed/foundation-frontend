# FR-17F-1 — Foundation dashboard experience: System Admin and Tenant

**Date:** 2026-11-11  
**Scope:** front-end only visual and information architecture improvements of existing route `/system/dashboard` and `/dashboard`. No new fabricated metrics, auth changes, API contract modifications or mock production data.

## Tenant dashboard

- Distinct premium "workspace command center" hero uses **actual authenticated** `TenantWorkspaceSummary.tenant/profile`. Displays Tenant name/slug and the backend-derived branch count.
- Four source-bound KPI cards: registered branches (actual `branchesCount`), profile city, count of **verified commercial** module codes (0 when not entitled) and subscription end (only an actual UTC date, represented in Persian calendar for display). No random trends, conversion percentages, revenue or active-customer counts.
- Clear commercial `status` card: `Pending` is NOT `Active`, requested PlanKey is shown only as an **intent**, entitlement does not grant member Permission, and zero commercial modules remains zero. No snapshot is considered valid if workspace/subscription API fails.
- Shortcuts go only to the three **already existing** Tenant actions: view business profile, list branches and user-explicitly expand existing Plan order component. No new privileged /members /roles /groups links are shown by guessing a role or Tenant ownership; existing dynamic navigation and guards remain intact.
- Existing source-backed Plan allowance and Owner-only SQL usage panels remain conditional on `hasCommercialEntitlement`, never fabricated. Existing billing flow is not invoked automatically.
- Responsive four-to-two column KPIs, two-to-one content panels, full mobile hero, keyboard-visible interactive areas. All dashboard styles are scoped under `.tenant-command-center` to avoid global layout regressions and preserve light/dark theme tokens.
- `formatPersianDate` uses `Intl.DateTimeFormat('fa-IR-u-ca-persian', {timeZone:'UTC'})` for the actual server-returned UTC entitlement date, not date manipulation or time-zone guessing.

## System dashboard

- Reorganized existing nine backend-sourced `SuperDashboardDto` counters into four primary KPIs and five secondary KPIs. Original values and API call unchanged.
- Hero shows **real** `totalTenants` and `activeUsers`, with a visually prominent conic progress ring derived ONLY from `activeTenants / totalTenants` (0 when none). No hard-coded 80% satisfaction or revenue.
- Existing tenant activity/active-vs-inactive summaries, recent tenant list, permission-filtered quick links and zero-state survive; new central Plans and Menu quick links use the existing `*systemCan` directive.
- Dates of recent tenant registrations are rendered in Persian calendar; API timestamps remain UTC. All new CSS is scoped to `.system-overview` for safer integration with shared admin shell.
- Visual hierarchy: compact header, deep plum hero, warm rose accents, spacious neutral KPI cards, readable role/user summaries, genuine empty/loading/error states, responsive mobile grids.

## Security / acceptance

- No browser-derived User/TenantId and no action is authorized by a KPI count. Existing backend permission and session checks remain sole authority.
- `tenant-workspace-pages.spec.ts` exercises source-backed hero/KPIs, non-entitled/PlanKey distinction, no fake allowance/usage panels, date, branch and error states.
- `system-dashboard.component.spec.ts` checks active percentage, real stats groups, empty state, Jalali date and existing 403/retry.
- Existing `tenant-subscription-shadow.spec.ts`, system permissions/navigation and all other tests unchanged.
- No new backend commercial module is claimed by this visual PR. First real Commercial Domain+EndpointGroup follows as a separately reviewed backend slice rather than introducing an invented paid module or automatic grants through a UI facelift.
