# Shinera — Real Workspace Signup

The Angular 22 signup wizard provisions a real workspace via the ASP.NET Core Identity module. The mock checkout has been removed.

## Routes and lifecycle

1. Public: `/start/:plan` or `/start?plan=salon`; user selects a **requested** plan/cycle.
2. Owner: first/last name, mobile (becomes **login username**), email, password.
3. Business: business profile, unique slug, optional alternate details for **main branch**.
4. Review: accept both legal policies, solve CAPTCHA, submit.
5. `GET /api/public/signup/slug-available?slug=...` checks availability (advisory only; concurrent request conflicts are handled by SQL unique index).
6. `POST /api/public/signup/checkout` creates Tenant, BusinessProfile, Main Branch, Owner User, Owner Role, membership, TenantClosure **in one DB transaction**.
7. After success, redirect to `https://{slug}.shinera.ir/auth/login?registered=1`; owner signs in with **mobile and password**, CAPTCHA, and tenant login context.
8. Guarded `/dashboard` calls `GET /api/tenant/workspace` with bearer token and shows actual business and main branch.

**NO payment gateway is connected.** `RequestedPlanKey` and `RequestedBillingCycle` are stored as onboarding intent only. UI prices are indicative; the actual subscription remains `pending_activation`. Do not grant paid features or display payment success here. Billing, verified callbacks, feature gating, pricing catalog, and owner verification are separate work.

## API

`POST /api/public/signup/checkout` body:
```json
{
  "planKey": "solo",
  "billingCycle": "monthly",
  "promoCode": null,
  "tenant": { "name": "Example", "slug": "example-salon", "culture": "fa-IR", "timezone": "Asia/Tehran", "currency": "IRR" },
  "businessProfile": { "displayName": "Example", "activityType": "solo", "phone": null, "city": "Tehran", "address": "Example Street", "postalCode": null, "instagram": null },
  "owner": { "firstName": "Test", "lastName": "Owner", "mobile": "09123456789", "email": "test@example.com", "password": "<your-password>" },
  "branch": null,
  "acceptTerms": true,
  "acceptPrivacy": true,
  "captchaToken": "<token-from-existing-captcha-endpoint>",
  "captchaCode": "<user-entered-code>"
}
```

Response: `tenantId, ownerUserId, mainBranchId, slug, accountUsername, planStatus`. HTTP 400 = invalid form/CAPTCHA; 409 = duplicate slug (including racing requests); 429 = rate limited.

The password is hashed by the existing ASP.NET Core password hasher before SQL persistence. No password is passed in the redirect URL. The **server** chooses all IDs and role assignments.

## Deployment prerequisites

- Apply reviewed EF Identity migration `20261025100000_workspaceprovisioning`. Production migration sequencing is currently gated behind the reviewed permission-code migration rollout; do not bypass that safety gate.
- Configure DNS wildcard `*.shinera.ir`, web server bindings/TLS certificates, and routing of tenant subdomains to the same Angular app and `/api` backend.
- Configure backend `Tenant:WorkspaceBaseDomain` and frontend `workspaceBaseDomain` consistently. Default production is `shinera.ir`; development uses `shinera.localhost`.
- Test from an actual tenant subdomain. Root marketing and system-admin routes must never require tenant bootstrap.
- Configure legal-policy links and an ownership verification strategy before public production launch. CAPTCHA and the 5/IP/minute signup throttle mitigate abuse but are not a substitute for email/phone verification.

This PR does not merge into the future billing/trial implementation.
