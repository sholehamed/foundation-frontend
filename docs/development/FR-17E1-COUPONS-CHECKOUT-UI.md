# FR-17E-1 — System coupon administration and Tenant optional coupon checkout

**Date:** 2026-11-11  
**Angular PR:** [#65](https://github.com/sholehamed/foundation-frontend/pull/65)  
**Backend PR:** [#138](https://github.com/sholehamed/foundation-backend/pull/138)

## System Admin workflow

The central **`/system/plan-catalog`** screen now contains a coupon section. The System Admin can issue a random code with title, `Percentage` (1..100) or positive `FixedIRR` value, optional pinned Published PlanVersion, number of validity days, total settled-use cap and per-Tenant settled-use cap. There is no frontend-supplied coupon secret: the backend generates a 96-bit high-entropy code and stores only its hash. The protected API reveals the secret **once at creation**. The Angular screen displays it inside the current session so an operator can copy and securely retain it; subsequent listing **never returns the secret**. Avoid logs, screenshots and unnecessary email propagation.

The coupon list shows definitions, remaining capacity and settlement usage, and offers a disable action. Disabling affects future redemptions, **not** the historical settled ledger. On older databases, the new central `PLAN-CATALOG.COUPONS` permission requires a reviewed Feature Registry Apply and audited System SuperAdmin grant; it is not silently restored after revocation. The backend always checks live permission, regardless of optional global RBAC rollout mode.

### Dates and Persian UI

The current UI accepts validity as a whole number of days, generating explicit ISO UTC start/end timestamps (with a five-minute client clock-skew cushion for the start). It deliberately avoids a Gregorian calendar picker. The backend accepts explicit UTC dates, allowing a future native Jalali schedule editor without changing the coupon data model. This is the first operational issuance flow, not a comprehensive campaign calendar.

## Tenant Owner checkout

The existing **«مشاهده و ثبت سفارش پلن»** panel now offers an optional code input. It sends exactly:

```json
{
  "planVersionId": "<published-immutable-guid>",
  "billingCycle": "monthly",
  "idempotencyKey": "<secure-uuid>",
  "couponCode": "<server-issued-24-hex-code>"
}
```

The code is omitted when empty. **No user-provided Net, Gross, Discount, currency, TenantId, settlement flag or Permission is ever accepted**. The server computes the quote from a vetted code-owned Commercial Module and the current published PlanVersion offer.

A zero-total coupon is an immediate, fully audited backend settlement; the UI only says **«سفارش صفرریالی تسویه و اشتراک ... فعال شد»** after the backend returns `zero_total_settled_and_activated` or an idempotent replay of that confirmed settled-zero Order. Partial discounts return a Pending order and retain the manual verified-receipt workflow from FR-17C-2A; the operator must settle it before a license exists. The coupon input becomes part of the client-generated idempotency selection key; changing the coupon does not incorrectly reuse a previous checkout UUID. The server independently deduplicates a same-plan/cycle/coupon Pending quote after refresh.

The existing public PlanCards determine available PlanVersions and cycles; the UI cannot invent a new plan or change prices. A coupon is **not** a role grant or an additional Module entitlement.

## Test acceptance

- Service unit tests assert System issue/list/disable payloads, no client-chosen coupon code or TenantId.
- Tenant order unit HTTP tests assert optional couponCode is sent with no payment flag, price or discount value.
- Existing Angular Unit/Build and Chromium BFF pilot must remain green.
- Backend disposable SQL Server tests verify one-use cap, 100% zero settlement, 1 settled redemption and 1 Active Subscription; partial FixedIRR pending quote consumes no redemption until System-reviewed manual settlement.
- Confirm frontend deploy after backend migration and routes; check real Staging separately.

## Current limitations

No live Commercial Module is registered yet in the backend's vetted source manifest. Public cards/tenant checkout may therefore still be empty, even though coupon issuing UI and CRUD are implemented. This prevents fake catalog rows and coupon records from enabling undeployed functionality.

No dynamic user Permission/Entitlement conjunction, renewal, refund or cancellation, automatic gateway verification or complete tax/invoicing exists. See [Backend FR-17E-1](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-17E1-CATALOG-COUPONS-ATOMIC-REDEMPTION.md) for risk and consistency controls.
