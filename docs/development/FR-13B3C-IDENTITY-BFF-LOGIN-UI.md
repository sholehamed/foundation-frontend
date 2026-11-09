# FR-13B-3C — BFF Identity-host automatic forced first-password change

Date: 2026-11-09. Companion to Backend [Issue #81](https://github.com/sholehamed/foundation-backend/issues/81). Backend design: [FR-13B3C-BFF-IDENTITY-FORCED-CHANGE](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-13B3C-BFF-IDENTITY-FORCED-CHANGE.md) after merge.

## Employee UX — one existing Login

1. Tenant app uses `/bff/auth/login` to navigate to the **separate Identity origin**, where the original `/auth/login` component receives `login_context=tenant`, `tenant=...` and a validated local `/api/connect/authorize?...PKCE...` `returnUrl`. No duplicate login form is needed.
2. The original CAPTCHA, `GET /api/system/Auth/csrf`, and `POST /api/system/Auth/interactive-login` are unchanged for normal credentials; **204** means the Identity-host cookie was issued and Angular may navigate to the validated local OIDC continuation. Any other response must be strictly parsed and cannot trigger OIDC navigation.
3. When Backend proves a valid first-login credential, the same POST returns **200 `{status:'password_change_required',challenge,expiresAtUtc}`**, without Identity cookie. The component switches **in place** to the password change/confirmation form already used by FR-13B-3B. The challenge remains in component memory only and is erased on navigation, component destruction, expiry or success. It never reaches the Router, storage, telemetry, or TokenStorageService.
4. `AuthService.completeInteractiveFirstLogin` bootstraps a **fresh Identity XSRF cookie** with `GET /api/system/Auth/csrf`, then calls `POST /api/system/Auth/interactive-first-login/complete` using same-origin `withCredentials:true` with `X-XSRF-TOKEN`. This request uses **only the Identity antiforgery cookie**, not any BFF application cookie, normal bearer token or a new authenticated session. Identity API is explicitly classified as anonymous in `apiAuthInterceptor`.
5. Only a verified **`{passwordChanged:true,requiresRelogin:true}`** clears state and navigates back to **`/auth/login?passwordChanged=1&tenant=...&returnUrl=...`**. The `returnUrl` was independently validated as a local OIDC Code+PKCE continuation and is *never executed automatically* after password change. The user must enter the **new** password/CAPTCHA in the normal form; a later **204** may resume the OIDC continuation.
6. The normal Tenant-host legacy first-login resolver remains unchanged. System login, email invitation and prior `/auth/first-login` route stay compatible. No cross-origin XHR or unsafe parent-domain cookies.

## Boundary and rollout

- Backend `Identity:TenantFirstLogin:Enabled=false`, Angular `tenantFirstLoginEnabled=false` by default. This is an explicitly reviewed pilot, not the default production deployment.
- Angular's `bffTenantPilotEnabled` is a **separate** flag for Tenant *app* BFF navigation. Identity-host JS always uses `interactive-login` when carrying a validated `/api/connect/authorize` continuation; the forced change UI is shown only for a valid, fully checked **Tenant** continuation.
- The Identity origin must be a TLS-protected exact `identity.`/`auth.` workspace host, equal to configured Backend Authority if specified; same-origin reverse proxy under `/api`. Do not configure wildcard CORS, put temporary secrets in URL/localStorage, or share Identity and BFF cookies.
- Existing PR CI includes secure host/response-shape tests and Angular unit/Chromium regressions; it does **not** prove the end-to-end hosted OIDC first-login lifecycle. Test only on provisioned, approved isolated Staging with applied SQL migration, reviewed Tenant registry and Owner grants. Production first-login/BFF flags stay OFF.
- New user still needs a real email at create-time until [#78](https://github.com/sholehamed/foundation-backend/issues/78) is implemented; physical handoff of the one-time initial password is required.
