# Angular full BFF integration — approved target / not implemented

> Status: **Accepted design, not yet implemented.** Backend source of truth: [ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md) and [HTTP contract](https://github.com/sholehamed/foundation-backend/blob/main/docs/reference/browser-auth-contract.md). Frontend tracking: [#3](https://github.com/sholehamed/foundation-frontend/issues/3).

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
- `src/app/app.config.ts` initializes Tenant twice; migration must not trigger authenticated APIs for anonymous public pages.
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
