# Foundation Angular Identity UI and BFF v1 implementation contract

**Status: complete design/typed-contract slice, 2026-11-06; BFF-06 migration NOT started.**
Canonical protocol/Host/HTTP schema: [backend Identity UI ↔ BFF login contract](https://github.com/sholehamed/foundation-backend/blob/main/docs/architecture/identity-ui-bff-login-contract.md).

## Decision

**Keep the existing Angular project and SignInComponent.** The *same Angular build* may be served on a dedicated HTTPS Identity login origin (e.g. `identity.shinera.ir`) and application System/Tenant origins. A deployment ingress **must restrict the Identity origin to** Angular login routes (plus static assets), `/api/connect/authorize` and Identity-owned `/api/system/Auth/*`. App dashboard and `/bff/*`/`/signin-oidc` are ONLY on application origins. This is one frontend repo, not two Angular projects.

Existing route binding:
- `/system/auth/login` binds `login_context=system` to SignInComponent.
- `/auth/login` binds `login_context=tenant`.
- `withComponentInputBinding()` in app.config binds route data/query values to inputs. Angular route inputs are UX hints, **not trusted authentication grants**; backend separately validates host, tenant and context.
- For an OIDC login continuation, Identity sends `returnUrl=/api/connect/authorize?...` (fully URL-encoded in login page query). `validateBffAuthorizationReturnUrl` allows only that local Code+S256 first-party client and matching route-context/tenant, and Angular `AuthService.interactiveLogin` performs same-origin CSRF bootstrap + POST. Browser then navigates to that validated local continuation.
- For the **legacy** local login route with no OIDC continuation, existing `AuthService.login` still uses Password Grant and TokenStorageService. **Do not change this until BFF-06.**

## Diagram — distinct browser origins

`
[tenant-a.shinera.ir Angular app]            [shinera.ir system Angular app]
       |  GET /bff/auth/login                      |
       +------ application BFF OIDC challenge -----+
                                |
                                v top-level browser redirect
                    [identity.shinera.ir Angular]
                    /auth/login or /system/auth/login
                                |
                     GET /api/system/Auth/csrf
                     GET /api/system/Auth/captcha/new
                     POST /api/system/Auth/interactive-login
                                |
                     Identity HttpOnly session cookie
                     GET /api/connect/authorize
                                |
                      one-time code + state + PKCE
                                v
               [calling application /signin-oidc]
                     Server SQL ticket + host-only
                        __Host-Foundation.Bff
                                |
                        GET /bff/session
`

The Identity Cookie `__Host-Foundation.Identity` never authenticates an application BFF route. The BFF cookie cannot authenticate the Identity login form and is never read from JS. Token exchange and refresh remain server-side.

## Existing HTTP shape (do not invent new routes)

1. **Application browser redirect:** GET `/bff/auth/login?returnUrl=%2Fdashboard` (Tenant) or `?returnUrl=%2Fsystem%2Fdashboard` (System).
2. **Identity code request:** GET `/api/connect/authorize?...` validates confidential BFF client, exact callback and PKCE and sends 302 to local Angular login route if no Identity cookie.
3. **Interactive form on Identity origin:** GET `/api/system/Auth/captcha/new`; GET `/api/system/Auth/csrf` returns JS-readable `XSRF-TOKEN`; POST `/api/system/Auth/interactive-login` with JSON `{username,password,captchaId,captchaCode,loginContext,tenant}`, Header `X-XSRF-TOKEN` and same-origin Identity antiforgery cookie; 204 on success and **no access/refresh tokens**. Then browser navigates to validated local continuation.
4. **Application callback** `/signin-oidc` uses server PKCE Code exchange, no tokens in JS, sets an opaque app-host-only cookie, then redirects to a verified local URL.
5. **Future client session** GET `/bff/session` uses Cookie only; 200 `BffSessionResponse` (see `src/app/shared/models/bff-session.contract.ts`), 401 unauthenticated/expired, 403 host/context mismatch. Never feed BFF tokens into localStorage or use Bearer from Angular in this mode.
6. **BFF unsafe requests** GET `/bff/auth/csrf` then POST `/bff/auth/logout` or `/bff/auth/logout-all` with `X-XSRF-TOKEN` and same-origin metadata. Current logout-all revokes existing SQL tickets, **NOT** Identity SSO or upstream token grants.
7. **API routing** `/api/*`: current Angular runtime sends legacy bearer. Future BFF-06 switches to same-origin BFF proxy/cookie on API path; server authenticates/forwards API credentials. This forwarding/Angular switch does NOT exist yet.

## Host separation and frontend startup

`src/app/shared/util/tenant-workspace-host.ts` is intentionally pure, covered by tests and called from `app.config.ts` before TenantContext initialization. Valid tenant workspace DNS is one nonreserved slug under the configured workspace domain (e.g. `salon1.shinera.ir`). Root, unrelated, nested and reserved infrastructure hosts `identity`, `auth`, `api`, `system`, `admin`, `www` etc MUST NOT initialize TenantContext. The **backend** remains authoritative: `BffHostContextResolver` independently rejects infrastructure hosts (Identity/auth even if configured as SystemHosts). This avoids misclassifying the Identity-only Angular sign-in host as a Tenant.

No OAuth client secret, token, cookie payload, accountId or tenantId from browser inputs should become a security source of truth. The Identity host must not accept a cross-origin credentialed form XHR; configure a same-origin HTTPS `/api` proxy.

## Engineering ownership and next cutover

| Layer | Now (phase 1) | Later (release-gated) |
| --- | --- | --- |
| Angular UI | Existing login component and OIDC continuation, host classifier and frozen types | Authentication entry redirect & full BFF state/guard/interceptor replacement |
| Identity Server | OpenIddict Code+PKCE, Identity cookie, same-origin interactive endpoint, CAPTCHA/CSRF | Upstream SSO/refresh revocation, refresh coordination and browser validation |
| Application BFF | Host-aware Challenge/Callback/Session/CSRF/local Logout-All and SQL session store | Proxy API auth forwarding, production HA/keyring, race/security acceptance |
| Deployment | DNS, ingress and security route contract documented | Real TLS reverse-proxy browser/SQL HA E2E and rollback |
| Legacy | Password Grant remains on by default | Remove only after BFF-06/BFF-07 tested migration and native-client inventory |

## Acceptance for phase 1

- [x] One Angular project provides both System/Tenant Identity form routes and first-party BFF local continuation.
- [x] Identity API and BFF session/protocol route/JSON contracts frozen and mirrored in backend docs.
- [x] Identity subdomain is excluded from TenantContext initialization; workspace subdomains still initialize; tests cover both.
- [x] Existing OAuth/CSRF/PKCE/host validation suites remain passing in CI (after PR merge verification).
- [x] BFF default flag and Angular legacy auth unchanged.
- [ ] **Intentionally outside phase 1**: real browser login from deployed Identity-only HTTPS host, reverse proxy, upstream SSO end-session/refresh revocation, Angular BFF-06 runtime migration and Password Grant elimination.

**No change to F00 baseline PR #2.** Continue from backend [#20](https://github.com/sholehamed/foundation-backend/issues/20), frontend [#10](https://github.com/sholehamed/foundation-frontend/issues/10).
