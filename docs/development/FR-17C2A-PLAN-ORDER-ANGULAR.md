# FR-17C-2A — Tenant Order Form & System Admin Manual Payment Review

**Date:** 2026-11-11  
**Frontend PR:** [#64](https://github.com/sholehamed/foundation-frontend/pull/64)  
**Backend companion:** [#135](https://github.com/sholehamed/foundation-backend/pull/135)  
**Status:** PR, subject to current-head Angular CI and post-merge main verification.

## Functionality

The Tenant Dashboard has a lazy **«مشاهده و ثبت سفارش پلن»** panel. It loads only when opened, preserving existing owner/dashboard tests and reducing unnecessary public catalog queries. This is an **Owner-only** server operation, not a permission any Tenant staff can invoke. If a non-owner gets HTTP 403 the panel hides.

The panel reads exactly the same DB-published `PublicPlansService` PlanCards as the public landing/signup. The only writable inputs are PlanVersionId, offered monthly/yearly cycle and a cryptographically generated request UUID. **No amount, currency, discount, TenantId, isPaid or Subscription status is sent by Angular.** The server re-resolves a source-owned Commercial Module and IRR offer and creates only a Pending Order.

The list of the last 50 Tenant Orders comes from `GET /api/tenant/workspace/subscription/orders`, scoped by authenticated Tenant. The UI displays Pending/Settled accurately. A successful POST says the Order is awaiting settlement; it does not claim a license was activated.

The existing central `/system/plan-catalog` System Admin screen now offers an explicit refreshable queue of up to 100 Pending Orders, including Tenant ID, immutable PlanVersion, billing cycle, NetAmount in IRR. SuperAdmin must enter a receipt reference and check **«تأیید می‌کنم دریافت وجه را مستقل از نرم‌افزار بررسی کرده‌ام»** before the button activates. The backend still independently enforces live Master SuperAdmin, central `PLAN-CATALOG.SETTLE`, validated Pending/positive/IRR Order, current saleable Commercial product and one active license.

The confirmed result is only described as active after the server returns `settled_and_activated`. UI never generates tenant memberships or grants.

## Endpoint contract

- Tenant Owner: `GET/POST /api/tenant/workspace/subscription/orders`. POST: `{planVersionId,billingCycle,idempotencyKey}`.
- System SuperAdmin: `GET /api/system/PlanCatalog/orders/pending`.
- System SuperAdmin: `POST /api/system/PlanCatalog/orders/{id}/confirm-external`. Body: `{receiptReference,paymentVerified:true}`.
- Neither Angular component ever sends TenantId as a query or route parameter for writes. No checkout button can activate a Subscription directly.

## Why public catalog may be empty

Foundation currently declares zero **code-owned Commercial Modules** in `ModuleResourceContracts.Current()`; the backend correctly forbids commercial publication and new checkout, even if an operator manually inserts misleading DB rows. The page therefore shows **«هنوز پلن تجاری قابل سفارشی در سیستم منتشر نشده است»**, not static fake cards or a fabricated amount. The system admin queue may likewise be empty.

## Tests

- Angular service specs verify Tenant order POST has no TenantId/price/payment field; System attestation POST contains only the verified receipt reference/boolean and order ID in the route.
- Existing Tenant dashboard and System PlanCatalog specs remain unaffected because order controls are lazy/manual refresh; Unit/Build and Chromium BFF pilot still required.
- Backend real SQL acceptance covers positive and negative quote, idempotency, cross-Tenant isolation, one subscription, repeat admin attestation and permission-independent activation.
- Deploy backend PR first. Existing System superadmins may need reviewed central Feature Registry reconciliation and `PLAN-CATALOG.SETTLE` role grant; never silently restore revoked permissions.

## Not completed

No provider gateway verification, no promo-code redemption, no 100%/fixed-value discount ledger or zero-total activation, no permission conjunction and no automatic renewal. A checked manual attestation is an **operator statement**, not bank verification. Production-grade append-only operator audit and accounting reconciliation remain separate, as specified in the [backend handoff](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-17C2A-TENANT-ORDERS-MANUAL-SETTLEMENT.md).
