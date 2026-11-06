# BFF-04 — Angular Identity UI continuation handoff

> Verified 2026-11-06. [Frontend PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) merged at `e94c144e4293faa297290aa608c5e7409aeaa1c2`; [CI 42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581) passed **22/22 unit tests** in **12 files** and development Build. This is **not** BFF-06 browser-session migration.

## Why this exists

The existing login page is also used by the Authorization Server. When OpenIddict redirects an unauthenticated authorization request to `/system/auth/login` or `/auth/login`, it includes a query parameter named `returnUrl`. Previously, Angular accepted only ordinary app routes and could not safely continue `/api/connect/authorize` after Identity sign-in. Returning OAuth tokens to JavaScript or accepting arbitrary return URLs would be unsafe.

## Implemented flow

1. The caller begins at BFF `/bff/auth/login?returnUrl=/dashboard` (only after BFF is enabled in a reviewed test deployment).
2. OpenIddict challenges the first-party confidential BFF client. Anonymous AS user is redirected to its local login UI with a same-origin `/api/connect/authorize?...` return URL.
3. `src/app/shared/util/bff-login-continuation.ts` validates that URI before using it. It checks local path, exact first-party client ID, Authorization Code, S256 PKCE, state/nonce, HTTPS `/signin-oidc` callback and System/Tenant account/slug consistency. The backend independently validates all OAuth protocol parameters and registered callback URIs.
4. `src/app/shared/services/auth.service.ts::interactiveLogin()` requires `environment.apiUrl` to resolve to **the exact same origin as the Identity UI**, obtains `GET /api/system/Auth/csrf` and posts user credentials, CAPTCHA and `X-XSRF-TOKEN` to `POST /api/system/Auth/interactive-login` with cookies.
5. On successful HTTP 204, `src/app/shared/pages/auth/sign-in/sign-in.component.ts` performs `window.location.assign()` to the allowlisted local authorization path. The AS then completes OpenIddict authorization; Angular never consumes the code or bearer token.
6. Without an OIDC return URL, login still uses the original Password Grant, bearer API interceptor and localStorage token storage. No opaque BFF session guards are enabled yet.

## Configuration and routing

- Production Angular and Identity API for this UI must be served behind the same HTTPS origin. Use `apiUrl: '/api'` on that host; proxy `/api/*` to Identity, and host the expected Angular login path on the same origin.
- Development environments with Angular at one origin and Identity API at another (even different localhost ports) will **not** pass `interactiveLogin` same-origin validation. Configure a local HTTPS reverse proxy rather than broad `Access-Control-Allow-Credentials`.
- `/signin-oidc` callback belongs to the **BFF host**, not Angular. Only the server-side .NET OIDC middleware receives it.
- The `Identity:Bff:ClientId` configured in the backend must match Angular `environment.bffClientId`, currently `foundation-browser-bff`. Real callback URIs are an operator-controlled allowlist, not determined by Angular.
- The old duplicate app initializer was removed from `src/app/app.config.ts` so the root System/Identity login does not run unneeded Tenant initialization.

## Test and code map

- `src/app/shared/util/bff-login-continuation.spec.ts`: valid System/Tenant continuation, wrong tenant, bad client or response type, unsafe return paths, duplicate state/incorrect callback and PKCE method.
- `src/app/shared/interceptors/api-auth.interceptor.ts`: anonymous `csrf` / `interactive-login` requests must not inherit stale legacy bearer token.
- `src/app/features/system/admin/admin-form/admin-form.component.spec.ts`: corrected a copied `UserFormComponent` import discovered by new full frontend CI; this is unrelated to browser migration.
- `.github/workflows/frontend-bff-ci.yml`: `npm ci`, `npm run test:unit`, `npm run build -- --configuration development` for PRs and main.
- Pre-merge CI [42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581): **12/12 test files, 22/22 tests**, development Build succeeded.

## Remaining gates / resume next chat

- [ ] Verify actual Identity UI redirect on a same-origin HTTPS deployment, including a Tenant login when AS host is different from the tenant BFF host.
- [ ] Verify backend BFF Authorization Code callback and protected browser cookie on real Identity TestServer before enabling the feature.
- [ ] After BFF-05, implement same-origin `/bff/session`, XSRF, logout/revocation, Signals session store and guards in a distinct BFF-06 feature PR.
- [ ] Remove browser OAuth token storage / password grant / bearer interceptor **only after** System and Tenant E2E passes; preserve native/service bearer support.
- [ ] Track deployment host, trusted proxy, secret, cookie and tenant security gaps in the backend documentation.

Always check actual GitHub `main` and latest CI before starting new work; this document is a dated checkpoint, not an independent authority for current repository state.
