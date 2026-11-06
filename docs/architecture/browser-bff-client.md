## Latest backend BFF handoff — 2026-11-06 (frontend remains on legacy auth)

- [Backend BFF-04.3 PR #18](https://github.com/sholehamed/foundation-backend/pull/18) merged (signed fake-issuer OIDC middleware callback tests); [Backend BFF-05.1 PR #19](https://github.com/sholehamed/foundation-backend/pull/19) merged at `bcfc109488be75981dee7f3aead91e1bca38d976`. Latest PR-head [CI 42194597675](https://github.com/sholehamed/foundation-backend/actions/runs/42194597675): 58/58 BFF and 42/42 Identity tests, full build green.
- Backend now has **opt-in** `GET /bff/session`, using only the isolated BFF cookie, rejecting a bearer-only caller with 401 and invalid cross-host System/Tenant contexts with 403. It returns minimal no-store account/context JSON and no OAuth tokens.
- **Important:** a real OpenIddict Identity↔BFF two-host E2E is still missing ([backend #12](https://github.com/sholehamed/foundation-backend/issues/12)); CSRF, logout, revocation, live user/tenant validation and refresh hardening remain [backend #20](https://github.com/sholehamed/foundation-backend/issues/20). BFF is disabled by default. Do not switch Angular login, guards, interceptors or localStorage yet.
- [Frontend BFF-06 Issue #10](https://github.com/sholehamed/foundation-frontend/issues/10) tracks eventual same-origin session-store/Signal/CSRF migration and Playwright tests. Angular still uses legacy Password Grant except the secure Identity UI continuation already merged as PR #8.
- The two initial F00 PRs stay open by previous project decision. This current handoff supersedes older sections which describe the backend session API as not yet implemented.

## Current merged status — 2026-11-06

- **Merged:** [Frontend PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) at `e94c144e4293faa297290aa608c5e7409aeaa1c2`. Latest PR-head [CI 42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581): **22 unit tests (12 files)** + Development build passed. Includes a new `Frontend BFF safety CI` workflow in this repository.
- **Scope:** only the old Identity login UI gains a strictly allowlisted OIDC Authorization Code continuation using same-origin CSRF/interactive-login, then a full-page local authorization redirect. Normal sign-in still uses Password Grant and browser localStorage tokens, intentionally unchanged.
- **Security fix:** `AuthService.interactiveLogin` rejects cross-origin `/api` access; use a same-origin `/api` proxy to read the XSRF request token. The global root/tenant initializer duplication has been fixed.
- **Backend dependency:** [Backend PR #16](https://github.com/sholehamed/foundation-backend/pull/16) merged at `c4f6a81c302f3524bed3e58931221874be16928f` (46 BFF and 42 Identity tests green), but actual OIDC callback and BFF cookie E2E is not yet proven, and BFF is disabled by default.
- **BFF-06 migration NOT started:** no `/bff/session` auth store, cookie-only guards, CSRF/logout UI, removal of bearer interceptor or OAuth tokens from localStorage. Do not start until BFF-04 callback and BFF-05 session/revocation + cross-repo E2E are verified.
- **Implementation/operations:** [BFF-04 Identity UI handoff](development/BFF-04-IDENTITY-UI-HANDOFF.md).

# Angular full BFF integration — approved target; narrow Identity UI continuation merged

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
- `src/app/app.config.ts` previously initialized Tenant twice; Draft PR #8 fixes this without introducing authenticated API requests on public root pages.
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


## Cross-repository checkpoint (2026-11-06)

- Backend BFF-01, BFF-02 and **BFF-03** have been merged. [BFF-03 PR #11](https://github.com/sholehamed/foundation-backend/pull/11) passed isolated HTTP code/PKCE and scoped Identity tests: [CI 42130167589](https://github.com/sholehamed/foundation-backend/actions/runs/42130167589). The full browser BFF remains unimplemented; [BFF-04 Issue #12](https://github.com/sholehamed/foundation-backend/issues/12) and [merged PR #14](https://github.com/sholehamed/foundation-backend/pull/14) deliver only validated relative return URLs (35 BFF + 41 Identity tests green). The secure OIDC callback and server-side BFF session remain the next step.
- The Identity UI now has a narrowly allowlisted `/api/connect/authorize` continuation (merged PR #8). Full BFF callback / browser session still needs real E2E verification.
- Do not migrate Angular browser token storage yet. When backend BFF session endpoints and test deployment are ready, begin the BFF-06 session migration with E2E tests and update [PROJECT-STATE](../PROJECT-STATE.md).


## Identity UI continuation

The legacy sign-in component may continue one narrowly allowed local return path: `/api/connect/authorize` for the configured BFF client with Authorization Code + S256 PKCE, non-empty state/nonce, HTTPS `/signin-oidc` callback, and matching `login_context` / tenant. The UI posts credentials to the cookie-based `interactive-login` endpoint after CSRF bootstrap, then performs a full document navigation to the local authorization endpoint. All client/redirect/PKCE/account validation remains authoritative in OpenIddict/Identity; the Angular check is only a navigation allowlist.

All other login continues to use the current Password Grant until BFF-05 and cross-repo E2E are complete. Do not store BFF OAuth tokens in localStorage/sessionStorage.

## BFF-04 Angular continuation review checkpoint — 2026-11-06

- [Draft PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) supplies the **Identity UI OIDC authorization continuation only**, not the BFF browser-session migration. Normal login still uses the legacy Password Grant / local token storage.
- `validateBffAuthorizationReturnUrl` accepts only same-origin `/api/connect/authorize` navigation with the configured client, Authorization Code and S256 PKCE, strict state/nonce, HTTPS callback and matching account/tenant context. The backend remains authoritative for registered clients, callback, grants and identity.
- `AuthService.interactiveLogin` requires the Identity UI to share an **exact origin** with its `/api` endpoint; it refuses cross-origin credentialed login. Set `apiUrl: '/api'` behind a same-origin reverse proxy for Identity UI environments. On `https://localhost:4200`, calling `https://localhost:7262/api` directly does **not** meet this requirement. This prevents CSRF-cookie read failures and avoids expanding credentialed CORS.
- Corrected the pre-existing duplicate `TenantContextService.initialize()` startup call (the unconditional initializer ran on root marketing/system pages as well as tenant hosts).
- Corrected a miscopied pre-existing `AdminFormComponent` test import discovered by CI. [Frontend BFF CI 42140302464](https://github.com/sholehamed/foundation-frontend/actions/runs/42140302464): **22/22 tests (12 test files)** and Development build successful.
- The backend now implements `GET /bff/session`, but Angular BFF CSRF/logout/revocation, Signals auth store, removal of browser tokens and System/Tenant E2E are **not implemented**. Do not switch Angular guards/interceptors from the legacy flow until BFF-05/06 and browser E2E are ready.
