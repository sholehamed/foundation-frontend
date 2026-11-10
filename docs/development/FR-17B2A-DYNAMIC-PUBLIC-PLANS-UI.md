# FR-17B-2A — Published Plan Cards in Angular (backend PR companion)

**Status:** PR in review. Back end: `GET /api/public/plans` in Foundation backend; exact DTO source of truth documented in its `FR-17B2A-PUBLIC-PLAN-CARDS.md`.

## What changed

Landing `PlansComponent` previously contained **four copy-pasted static cards** (Solo, Solo Pro, Salon, Salon Pro). Signup also maintained its own *different* four-plan pricing table and used `solo-pro` as an unverified default. That could advertise unpurchased features, show prices unrelated to actual Orders or remap an unknown deep-linked plan silently.

- `src/app/features/public/shared/public-plans.service.ts` defines the typed published-card DTO and one HttpClient GET against `environment.apiUrl + '/public/plans'`.
- `home/components/Plans/plans.component.ts/html/scss` now displays server-published title, subtitle, ordered display features, badge and exact price/currency/cycle, preserving the existing Trezo-style cards; loading, empty catalog and retryable error states are explicit. Never render locally fabricated plans/prices.
- `signup-checkout.component.ts/html` consumes the **same** published rows. Exact PlanCode and supported price offer cycle are carried to `SignupCheckoutPayload`; an unknown URL `plan` stays invalid, never silently substitutes a default package. No claims of a branch cap when the API has not supplied a typed Limit. Genuine IRR is displayed as ریال, not تومان.
- When **no published plans exist**, signup retains an explicit `unselected` **core onboarding without any purchased subscription**. The backend accepts this special plan intent, creating an Owner and Tenant with no commercial entitlement. On actual catalog fetch failure, signup displays an error and retry; user can deliberately choose no-plan onboarding.
- Coupon box remains *intent only*: entering a promoCode does NOT validate discount, pay, reduce price or activate the subscription. No gateway integration is claimed.
- Angular tests: service URL/contract, homepage real cards + empty/error, signup deep-link validity, no-plan bootstrap, unsupported-cycle refusal.

## Backend dependence and required verification

1. Backend PR must be merged and deployed with `PublicPlans.Map` + `public-plans` rate limiter before Angular frontend is enabled in production. No browser proof against actual staging until both releases deploy.
2. Since the code-owned ModuleResourceContracts registry currently contains **no commercial modules**, `/api/public/plans` should return `[]` even if stray DB cards exist. This is safe: the frontend displays “no published plans” rather than inventing a license; `unselected` onboarding still works.
3. Backend signed first-login Tenant Owner bootstrap remains unchanged. Backend signup still records `RequestedPlanKey` as an intent, not a sale.
4. Future FR-17B-2B will implement System Admin draft/publish API and commercial module manifest. Future FR-17C provides subscription/effective access and separate billing/discount.

Run `npm run test:unit`, `npm run build -- --configuration development`, and the existing Chromium pilot suite before merge. Document test results in PR rather than assuming success.
