# FR-17C-3A Angular — PlanVersion Allowances (truthful read-only)

**Date:** 2026-11-11  
**Backend companion:** [PR #139](https://github.com/sholehamed/foundation-backend/pull/139), merged.  
**Scope:** Read-only presentation of *already returned* `/api/tenant/workspace/subscription/me` capability values. No new API endpoints, mutations, client authorization, or guessed usage.

## What the dashboard displays

`TenantPlanAllowancesComponent` is a standalone Angular component placed under the existing Tenant dashboard **only when** the server's `TenantCommercialEntitlementSnapshot.hasCommercialEntitlement` is true. It renders the source-returned `code` and typed value of each effective published PlanVersion capability, distinguishing:

- Explicit `isUnlimited=true` => نامحدود; never inferred from null/0.
- `integerValue=0` => the literal zero (not unlimited).
- Boolean capability => فعال / غیرفعال.
- `modes[]` => source-returned allowed modes.
- Empty capabilities => no registered dedicated capabilities for the plan.

The UI **explicitly warns** that limits shown are *Plan values*, **not actual consumption or remaining capacity**; only a future trusted Usage API will provide those counts. A purchased module alone does not grant the user permission. No presentation element becomes an access gate.

## Why only active confirmed subscriptions

A requested PlanKey on signup is intent only. Neither requested plan, pending order nor an unverified subscription permits rendering paid values. The dashboard uses the existing real server-scoped license response and never supplies a TenantId. Default production currently has **no real Commercial Module** source; it will not fabricate plan allowances or sample usage.

## Tests

`tenant-plan-allowances.component.spec.ts` covers 0 vs Unlimited, disabled Feature, AllowedModes and the no-counter disclosure, plus empty capabilities. Existing Tenant subscription GET contract tests remain unchanged.

## Next frontend step

Once backend provides an authoritative tenant-only current-period usage endpoint, a reusable `TenantUsageMeterComponent` can render `currentUsage`, `limit`, `remaining`, `periodEndUtc` and the source capability, with clear Unlimited state. Never locally compute a write authorization or leak another Tenant's metrics. This PR does **not** claim such an API exists.
