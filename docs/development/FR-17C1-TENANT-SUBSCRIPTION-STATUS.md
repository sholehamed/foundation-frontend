# FR-17C-1 — Tenant dashboard Subscription shadow status (read-only)

**Date:** 2026-11-11. **Frontend PR:** [#63](https://github.com/sholehamed/foundation-frontend/pull/63). **Backend:** [#134](https://github.com/sholehamed/foundation-backend/pull/134).

## Existing problem

The Tenant Dashboard formerly displayed the same permanent text **«در انتظار فعال‌سازی»** for every Tenant, regardless of actual state, because legacy `GET /api/tenant/workspace` returns a hard-coded `subscriptionStatus: pending_activation` placeholder. `BusinessProfile.RequestedPlanKey` is an expression of interest, **never proof of purchase**.

## New read-only contract

`TenantWorkspaceService.getSubscriptionShadow()` reads the authenticated `GET /api/tenant/workspace/subscription/me` endpoint. There is no TenantId query parameter, request body, payment callback or write method. The server resolves the context from the signed Tenant session and applies tenant-scoped SQL read filters.

`TenantCommercialEntitlementSnapshot` includes:
- `status` = NotSubscribed, Pending, Active, Inactive, Invalid, Unavailable
- machine-readable `reason`
- nullable PlanVersionId/SubscriptionId/start/end
- `hasCommercialEntitlement` boolean, permitted code-owned ModuleCodes and typed Capability values

Backend requires **active period + exact same-Tenant settled order + pinned Published PlanVersion + deployed vetted Commercial Modules** to return Active eligibility. It never issues actual `RolePermission`.

The dashboard loads workspace and shadow snapshot together and displays statuses truthfully: no subscription, awaiting verified settlement, active, inactive/expired, invalid proof, or unavailable module catalog. A missing/errored status endpoint displays a retryable dashboard error, never silently fabricates an active entitlement.

## Invariants

- Existing Tenant navigation and UI grants are untouched. The shadow is a status display, not runtime authorization and not a subscription purchase.
- Signup requested PlanKey is shown separately and is never converted client-side into `Active`.
- No coupon validation, price mutation, checkout or permission grant in Angular.
- Existing basic Tenant/Owner login remains possible without a commercial plan.
- The frontend companion must only deploy after the backend endpoint and SQL migration are available. Otherwise the dashboard will show a fetch failure (safe, explicit).
- Tests include `tenant-subscription-shadow.spec.ts` (exact URL, GET only, no TenantId), and `tenant-workspace-pages.spec.ts` (none/pending status and requested-plan independence), plus existing browser suite.

## Next stages

System Admin and Tenant subscription management views, subscription lifecycle and checkout/settlement, limit/quota and real paid permission-conjunction will be addressed only after the backend runtime guard is reviewed and integration-tested. A zero-net 100% coupon is only planned; it has not been redeemed or activated in this slice.

Full technical design: [Backend FR-17C-1](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-17C1-SUBSCRIPTION-SHADOW.md).
