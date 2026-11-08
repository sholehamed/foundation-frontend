# FR-12G-B — Tenant Angular BFF browser pilot (OFF by default)

2026-11-08. This is a non-Production opt-in pilot matching backend FR-12G-A, not a general BFF cutover.

## Runtime opt-in
All `environment.ts`, `.prod.ts`, `.e2e.ts` set `bffTenantPilotEnabled: false`. No normal user receives the new flow by default. To test in a controlled environment, create a private, reviewed frontend environment replacement with `bffTenantPilotEnabled: true`, `apiUrl: '/api'`, correct Tenant `workspaceBaseDomain` and same-origin HTTPS routing. The backend additionally requires `Identity:Bff:Enabled` and `Identity:Bff:TenantWorkspaceCookieBridge:Enabled` and explicitly blocks bridge activation in Production.

## Tenant application origin
- The Tenant app `/auth/login` button starts a **full browser navigation** to `/bff/auth/login?returnUrl=<safe relative Tenant dashboard>`. No client secret or Password Grant; the Identity origin still renders the existing interactive credential/CAPTCHA form and uses POST `/api/system/Auth/interactive-login` + same-origin CSRF for the reviewed OpenIddict continuation.
- A Tenant dashboard guard asks `GET /bff/session` on every navigation, requires `authenticated:true`, Tenant context and a matching host slug. An absent/expired session sends to `/auth/login`; forbidden/wrong-context goes to `/auth/access-denied`. It never recovers by reading a stored JWT. Backend remains authoritative for per-page permissions.
- Tenant app initialization clears legacy TokenStorage keys on pilot hosts. The BFF session service stores only non-secret UX session metadata in a Signal; **no OAuth access/refresh tokens or cookie IDs** are made available to JS.
- For same-origin `/api/tenant/workspace/**`, the auth interceptor strips any Authorization bearer and requests with `withCredentials`; for POST/PUT/PATCH/DELETE it first GETs `/bff/auth/csrf`, reads the JS-readable `XSRF-TOKEN` request token (not an OAuth token) and adds `X-XSRF-TOKEN`. It refuses remote-origin API paths, including a bad development configuration, rather than silently falling back to bearer.
- Other APIs (especially System/native bearer) remain on legacy auth in this limited pilot. Nothing grants a BFF cookie blanket access to `/api/system/**`.
- Tenant logout uses CSRF-protected POST `/bff/auth/logout` to revoke server-side ticket. It reports failures and does not claim success just because local Signal state cleared. IdP SSO/global logout remain separate.

## Test evidence and limits
- Service specs verify server-only session, invalid/401 clearing, XSRF bootstrap, cookie logout and safe local login return paths.
- Interceptor specs verify cookie-only Tenant reads, CSRF before writes, remote-origin denial and unrelated System bearer preservation.
- Host guard specs verify Tenant host match and reject another Tenant, Identity host or System session.
- Angular unit/build CI must be green before merge. Backend BFF cookie API bridge tests are separately gated.
- The independent `tenant-bff-chromium-pilot` job builds Angular with a **test-only** `bffTenantPilotEnabled: true` replacement environment and runs real Chromium against loopback `tenant-a.shinera.localhost`, with **controlled HTTP responses** for BFF session, Tenant branding and APIs. It tests browser navigation to `/bff/auth/login`, 401 redirect, cross-context failure, purge of old JS tokens, absence of Angular bearer headers on workspace reads, and CSRF-protected logout UI. This is NOT a real backend/IdP or real HttpOnly cookie/proxy E2E.

**This slice does not claim a full Chromium + actual OIDC / Identity / Angular HTTPS browser E2E**, SQL provider HA acceptance or Production rollout. Remaining FR-12G-C: dedicated same-origin HTTPS reverse proxy for System/Tenant/Identity origins, Chromium interactive credential + callback + BFF Cookie + real Tenant API/CSRF, cross-host replay/logout tests, staging provider/keyring and legacy browser cutover review.

Tracked under backend #44, frontend #10.