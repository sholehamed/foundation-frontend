# FR-17D-2B — Tenant Owner real usage and remaining quota panel

**Date:** 2026-11-11  
**Backend dependency:** [FR-17D-2B / PR #140](https://github.com/sholehamed/foundation-backend/pull/140).  
**Frontend scope:** one standalone Tenant dashboard usage component and a strictly typed read-only API client.

## Read-only endpoint

`TenantWorkspaceService.getSubscriptionUsage()` sends a GET to `/tenant/workspace/subscription/usage`, with **no TenantId, user, period, allowance, price, or usage parameters**. The backend uses the authenticated Tenant/Home scope, checks the local Owner authorization and verifies a settled in-period Subscription plus current code-owned Commercial Module manifest. The frontend does not turn an allow/deny decision on the API's counters.

The component is shown beneath PlanVersion allowances only when the existing server snapshot says `hasCommercialEntitlement=true`. This preserves the safe empty case: before a real source-owned Commercial Module is built, the UI never invents an active saleable product or usage.

## Display semantics

| Backend value | UI |
| --- | --- |
| `state=Measured`, finite | Shows SQL committed consumption and remaining units, with UTC period end converted for display to the Persian calendar |
| `state=Measured`, `isUnlimited=true` | Shows actual recorded units, limit/remaining as `نامحدود` |
| `state=DomainCountUnavailable` | Shows Plan's CountLimit but **no fabricated count**; explains the source-specific active record counter is not yet wired |
| `state=PeriodNotConfigured` | Explains the source Module has not defined its quota window; no usage claim |
| `state=PeriodConflict` | Explains period mismatch as a backend data integrity issue instead of treating missing data as zero |
| `overLimit=true` | Shows a warning, never assumes the client can change server authorization |
| HTTP 403 | Expected private owner-only status; does not say the Subscription is invalid |
| No active Subscription | No fabricated chart or metrics |
| Transport error | Retry available |

`limit`, `currentUsage`, `remaining` are exact **decimal strings** because backend values are SQL `bigint` and JavaScript `number` may lose precision. `formatUnits` groups digits and renders Persian numerals **without** Number conversion or floating-point rounding. `null` always means unknown/not applicable, whereas `"0"` is displayed as real zero.

Dates are UTC instants from SQL; the UI uses `Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'UTC',...})` for Jalali-facing read-only display. It does not mutate the backend's period, billing anchor or expiry.

## Scope, testing and rollout

- No storage, editable limits, new auth grant, new Angular guard or user-defined Tenant selection. Existing BFF request mechanisms are reused.
- `tenant-usage-overview.component.spec.ts`: API GET no TenantId/query, successful separate measured+unknown item presentation, 403 non-owner state, exact formatting above `Number.MAX_SAFE_INTEGER`, non-active Subscription and null-vs-zero safety.
- The panel does **not** show a CountLimit progress bar or PeriodQuota remaining if the backend has no authoritative answer. When real modules add domain Count providers, the same component can show actual values.
- API/HTTP/SQL release coordination remains necessary; Angular may receive 404 against an older backend, which it shows as retryable error. No staging/production rollout is claimed by CI.

## Next

Add vetted domain `CountLimit` adapters, a safe business command executor with same-transaction meter checks and a real code-owned Commercial Module; then build full authenticated HTTP and browser E2E for Tenant Owner vs staff and commercial access.
