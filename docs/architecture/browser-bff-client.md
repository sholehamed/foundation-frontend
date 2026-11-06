# Angular full BFF integration — approved target; narrow Identity UI continuation merged

## Completed phase 1: Angular Identity UI + BFF contract v1 (2026-11-06)

- [Identity UI/BFF contract](identity-ui-bff-login-contract.md) fixes **one Angular build** hosted on app origins and a dedicated Identity-only HTTPS origin: same-origin CSRF+CAPTCHA+interactive-login, continuation back to OpenIddict Code+S256 PKCE, then BFF host-only cookie and future `/bff/session`. Backend canonical [protocol specification](https://github.com/sholehamed/foundation-backend/blob/main/docs/architecture/identity-ui-bff-login-contract.md).
- The new pure `tenant-workspace-host.ts` classifier (with Vitest coverage) prevents Identity/auth and reserved infrastructure hosts from initializing a Tenant context. A type-only `BffSessionResponse` contract captures the *actual* server JSON without changing legacy runtime authentication.
- **Only phase 1 complete:** Angular Password Grant/TokenStorage/bearer guards still work; BFF flag stays OFF. Actual browser/proxy, IdP SSO/refresh revocation, SQL HA/DP rotation, and BFF-06/07 production cutover remain separate pending work.


## Verified backend BFF SQL cleanup and local logout-all — frontend handoff (2026-11-06)

- Backend [PR #34](https://github.com/sholehamed/foundation-backend/pull/34) merged at `576b7941fada322fc32def221836ff211f469574`. SQL Server maintenance-only bounded cleanup now retains rows until 48h past absolute expiry; [CI #42218028623](https://github.com/sholehamed/foundation-backend/actions/runs/42218028623) green: **94 BFF + 60 Identity + 12 SQL Server**.
- Backend [PR #35](https://github.com/sholehamed/foundation-backend/pull/35) merged at `18775eeb80ea6740d37943b516060172290e882e`. New **POST /bff/auth/logout-all** requires BFF cookie, host check, same-origin and antiforgery; derives target OIDC GUID `sub` solely from verified server-side principal and atomically revokes all **existing SQL BFF sessions** for that account. SQL migration adds subject binding and explicitly revokes older unbound sessions during rollout. [CI #42219967286](https://github.com/sholehamed/foundation-backend/actions/runs/42219967286) green: **96 BFF + 60 Identity + 17 real SQL Server**.
- **Do not confuse local logout-all with complete Identity signout:** upstream access/refresh tokens, IdP SSO login cookie and new logins after revocation are **not** invalidated by this endpoint. [Security/migration handoff](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/BFF-05-4A-LOGOUT-ALL.md).
- Frontend runtime remains unchanged: legacy Password Grant/localStorage/bearer interceptors and route guards continue, BFF flag remains OFF by default. **BFF-06 Angular migration is still blocked** by IdP upstream revoke/refresh rotation, actual browser/proxy/SQL failover/keyring certification and OIDC callback race, plus BFF-07 legacy-flow cutover.
- Continue from [backend master #20](https://github.com/sholehamed/foundation-backend/issues/20), [frontend BFF-06 #10](https://github.com/sholehamed/foundation-frontend/issues/10). Both initial F00 PR #2 remain untouched.


## Backend SQL Server atomic BFF store merged — frontend handoff (2026-11-06)

- Backend [PR #32](https://github.com/sholehamed/foundation-backend/pull/32) merged as `c2ebf86053c17fb87309ec630f932ac32701a127`. [Final CI #42215944644](https://github.com/sholehamed/foundation-backend/actions/runs/42215944644) passed full solution build, **94 BFF + 60 Identity + 9 real disposable SQL Server tests** (163/163). This is actual code/SQL evidence, not just an atomic interface placeholder.
- Web-owned `SqlServerBffAtomicTicketStore` has SQL row-serialized renewal/revoke, 24h fixed absolute deadline, protected server-side Ticket, predeployed schema with startup integrity check, and real two-TestServer shared persisted keyring/SQL Cookie logout/restart replay test. See [technical SQL rollout and guarantees](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/BFF-05-5B-SQL-ATOMIC-SESSION.md).
- **Still NOT frontend migration-ready:** SQL failover and production keyring encryption/rotation, logout-all/upstream refresh-token revocation, concurrency-safe refresh rotation, OIDC callback race, actual browser HTTPS/reverse-proxy/SQL Server system+tenant E2E and BFF-07 legacy-client sign-off remain open. Backend BFF opt-in default `false`.
- All current Angular auth implementation remains intentionally **unchanged**: legacy Password Grant/localStorage/bearer interceptors/guards and session state. BFF-06 migration starts only after backend BFF-05 closure with verified browser tests and a rollout/rollback plan; no cross-origin wildcard credentials. Track [backend #20](https://github.com/sholehamed/foundation-backend/issues/20), [SQL cert #30](https://github.com/sholehamed/foundation-backend/issues/30), [frontend #10](https://github.com/sholehamed/foundation-frontend/issues/10). Original F00 PR #2 untouched.


## Backend session durability / atomic provider handoff — 2026-11-06

- [Backend PR #28](https://github.com/sholehamed/foundation-backend/pull/28) merged at `ccbaddcad3d8e7c413a505ba7c8e2e0a04e59298`, [CI #42210307369](https://github.com/sholehamed/foundation-backend/actions/runs/42210307369): **88 BFF + 60 Identity**. The BFF ticket store now has an original 24-hour max lifetime and 48-hour revocation tombstone to guard against concurrent logout/renewal on a consistent shared cache.
- [Backend PR #29](https://github.com/sholehamed/foundation-backend/pull/29) merged at `b9a6bb77cedcc55511f2d45edff28667b20f5734`, [CI #42211389822](https://github.com/sholehamed/foundation-backend/actions/runs/42211389822): **94 BFF + 60 Identity**. Staging/Production BFF startup now requires a registered singleton atomic session provider rather than treating bare `IDistributedCache` as sufficient.
- **The atomic SQL Server provider does not exist yet.** [Backend issue #30](https://github.com/sholehamed/foundation-backend/issues/30) tracks its transactional implementation, multihost concurrency/eviction/failover tests, shared Data Protection keys and deployment evidence. A DI marker is not a production security certification.
- Angular Password Grant, localStorage, bearer interceptors, route guards and in-memory Signals are unchanged. **Do not start BFF-06 client migration or remove legacy auth** until actual atomic provider, logout-all/upstream revocation, browser/SQL Server/proxy E2E and remaining session lifecycle gates are closed. `Identity:Bff:Enabled=false` remains default; both original F00 PRs stay open.
- Resume from [backend BFF-05 issue #20](https://github.com/sholehamed/foundation-backend/issues/20) and [frontend BFF-06 issue #10](https://github.com/sholehamed/foundation-frontend/issues/10).


## Backend real callback + live Identity validator — verified 2026-11-06

- Backend [PR #26](https://github.com/sholehamed/foundation-backend/pull/26) merged at `fa76eb952d99353d1f66e9249ec63cc6e9ef4e21` after [CI #42208199510](https://github.com/sholehamed/foundation-backend/actions/runs/42208199510): **82 BFF + 60 Identity** tests all passed. Actual Foundation OpenIddict callback and Web live Identity DB validator were exercised for System and Tenant in two TestServers.
- This verifies stamp-based invalidation and removal of stale BFF tickets, **not** browser BFF readiness. Distributed renewal/logout races, upstream revocation/logout-all, absolute/idle expiry, browser/SQL Server/reverse proxy and multi-instance acceptance remain open.
- Angular still uses legacy Password Grant, localStorage and bearer interceptors. No Auth/Guard/Signals migration until BFF-05 release gates and real browser E2E. BFF remains disabled by default.
- Track [backend #20](https://github.com/sholehamed/foundation-backend/issues/20) and [frontend #10](https://github.com/sholehamed/foundation-frontend/issues/10). Original F00 PR remains open.


## Backend BFF-05.3 verified handoff — 2026-11-06

- Backend [PR #23](https://github.com/sholehamed/foundation-backend/pull/23) merged current-session CSRF/bootstrap/logout at `88239b7d3454fd03b87aa7bc20e70d1a820b088a`.
- Backend [PR #24](https://github.com/sholehamed/foundation-backend/pull/24) merged Web-hosted live Identity validation at `a676919d0d7d777c2c72895c7e1c9a9cd7987aa7`. Final [CI #42206724851](https://github.com/sholehamed/foundation-backend/actions/runs/42206724851) passed **82 BFF and 58 Identity tests**, solution build green. The Web host now rechecks active user/Tenant/lockout, security-stamp and scoped grants against current DB on BFF cookie reads, using a server-only snapshot.
- This is **not browser migration acceptance**: OIDC callback with the Web adapter, stale-ticket renewal races, token revocation/logout-all, absolute/idle expiry, SQL Server, multi-instance cache/keyring and actual browser same-origin/proxy flows remain outstanding.
- Angular login, Signals session state, route guards and bearer interceptors remain on the existing legacy Password Grant / localStorage flow. Do **not** switch until the BFF-05 release gates and browser E2E are complete. Backend `Identity:Bff:Enabled` is disabled by default.
- Tracking: [backend issue #20](https://github.com/sholehamed/foundation-backend/issues/20), [frontend issue #10](https://github.com/sholehamed/foundation-frontend/issues/10). The original F00 PR stays open.


> Status: **Full-session Angular BFF migration NOT implemented; Identity UI OIDC continuation merged in PR #8.** Backend source of truth: [ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md) and [HTTP contract](https://github.com/sholehamed/foundation-backend/blob/main/docs/reference/browser-auth-contract.md). Frontend tracking: [#3](https://github.com/sholehamed/foundation-frontend/issues/3).

## Frontend responsibilities

1. Angular and BFF/API use the **same browser origin**. Angular calls only relative `/bff/*` and `/api/*` URLs.
2. There is **no OAuth token in browser JavaScript**, localStorage, sessionStorage, routes or cookies readable by scripts.
3. `AuthService` becomes an in-memory Signals-backed session facade based on `GET /bff/session`. Do not infer authentication from a local flag or previous cache.
4. Login is full browser navigation to `GET /bff/auth/login?returnUrl=<safe-relative-path>`, not an XHR to OAuth token endpoint. Form credentials are handled by the Authorization Server's interactive sign-in endpoint.
5. Logout is an anti-forgery-protected **POST** to `/bff/auth/logout`, and Angular clears view state even when the server becomes unreachable; do not claim server revocation succeeded on network error.
6. Use Angular `withXsrfConfiguration({cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN'})` for same-origin unsafe requests; BFF validates the token server-side. Request anti-forgery cookie from `GET /bff/auth/csrf` when a session exists.
7. `401`: clear transient auth state and navigate to contextual login as appropriate. `403`: access denied, never redirect to login merely because of missing permission.
8. System/Tenant navigation guards are UX. Authoritative permission and tenant scope verification remain server-side.
9. Do not depend on `window.location.hostname` as sole proof of tenant authority; browser host is only a hint for UI. Server verifies session-to-host relationship.
10. Initial user profile and navigation permissions are server-provided **non-secret** data. If this data is cached client-side, its cache is never an authorization source.

## Proposed client code API (illustrative, not shipped)

```typescript
type SessionState = 'checking' | 'anonymous' | 'authenticated';
type LoginContext = 'system' | 'tenant';
interface BrowserSession {
  authenticated: true;
  user: { id: string; username: string; displayName: string };
  context: { type: LoginContext; tenantId?: string; tenantSlug?: string };
}
```

- `AuthSessionStore.load()`: GET /bff/session; 401 -> anonymous.
- `AuthSessionStore.login(returnUrl)`: use browser navigation to relative BFF URL.
- `AuthSessionStore.logout()`: CSRF-protected POST; clear state locally whether or not network succeeds.
- `HttpInterceptor`: no Authorization Bearer header; add correlation and normalized error handling only.

## Current code to migrate (not yet removed)

- `src/app/shared/services/auth.service.ts` calls password grant; must be migrated after working BFF login.
- `src/app/shared/services/token-storage.service.ts` stores OAuth tokens in localStorage.
- `src/app/shared/interceptors/api-auth.interceptor.ts` injects bearer access token.
- `src/app/shared/guards/system-session.guard.ts` and `tenant-session.guard.ts` trust local token presence.
- `src/app/app.config.ts` previously initialized Tenant twice; merged PR #8 fixes this without introducing authenticated API requests on public root pages.
- `src/environments/environment*.ts` contains Shinera-specific domains and OAuth client settings.
- `playwright.config.ts` and `e2e/README.md` refer to old cross-repo checkout and require new environment isolation.

## Migration sequence

- M1: Backend interactive Authorization Code + PKCE tested, confidential BFF client registered.
- M2: BFF session endpoints + secure cookie + server token store + anti-forgery tested.
- M3: Angular parallel session facade behind a temporary feature toggle; cross-tenant E2E green.
- M4: Remove JS token storage, password grant and bearer interceptor for browser routes; enforce fail-closed tests.
- M5: Ensure bearer native clients and browser sessions cannot impersonate or leak into each other's auth scheme.

## Browser security acceptance

- No OAuth tokens in JS state, network JSON, localStorage, sessionStorage, or readable cookies.
- Angular refresh of authenticated page calls /bff/session and restores view without JS bearer.
- Unauthorized vs forbidden responses remain distinct.
- CSRF missing/invalid request rejected on every cookie-authenticated write.
- Switching tenant host never reuses BFF cookie of another host.
- Login, logout, expiration and tenant/session revocation tested against real .NET backend.


## Current backend and continuation status

See [PROJECT-STATE](../PROJECT-STATE.md) for current PR/CI evidence and remaining gates. Real OpenIddict two-TestServer code flow is merged as backend PR #22. Backend PR #23 supplies CSRF bootstrap/current-ticket logout and exercises the lifecycle for both System and Tenant identities. Browser, SQL Server, live revalidation and distributed lifecycle remain separate acceptance gates.

## Identity UI continuation

The legacy sign-in component may continue one narrowly allowed local return path: `/api/connect/authorize` for the configured BFF client with Authorization Code + S256 PKCE, non-empty state/nonce, HTTPS `/signin-oidc` callback, and matching account/tenant context. It posts credentials to same-origin interactive login after CSRF bootstrap, then performs full-document navigation. OpenIddict remains authoritative.

A BFF logout removes the current local ticket only. The Identity cookie and other BFF tickets remain valid; a later login may therefore use Identity SSO. Never label this operation “sign out everywhere”. On a network error, clearing Angular state does not prove server revocation; show failure and allow retry.

Keep legacy normal login until lifecycle and full browser acceptance pass.
