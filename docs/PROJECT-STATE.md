# Foundation Frontend — project continuity and BFF status

> Updated: 2026-11-06  
> Repository: `sholehamed/foundation-frontend`  
> Stable integration branch: `main`

Read this before continuing in another chat. The canonical BFF architecture is maintained in [Backend ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md). Backend task-level checkpoint: [PROJECT-STATE](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md), [ROADMAP](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md).

## Accepted platform boundary

- Do not package Angular features yet; deliver complete, tested pages and workflows first, then extract reusable Angular libraries as needed.
- Full BFF is the target for browser-based Angular applications. OAuth tokens must never be retained in browser JavaScript, localStorage, sessionStorage or readable cookies. Authenticated session is an HttpOnly/Secure/host-only Cookie with server-side BFF ticket.
- Keep `System Admin` and `Tenant Application` routing/identity contexts separate.
- Continue supporting the existing Angular auth in `main` until the Backend BFF flow and cross-repo E2E are verified; do not replace login prematurely.

## Current Backend dependency checkpoint

| Backend slice | State | Reference |
| --- | --- | --- |
| BFF-01 protected ticket store | Merged | [PR #6](https://github.com/sholehamed/foundation-backend/pull/6) |
| BFF-02 interactive Identity cookie | Merged | [PR #8](https://github.com/sholehamed/foundation-backend/pull/8) |
| BFF-03 code + PKCE and scoped Identity principal | **Draft / under testing; not merged** | [PR #11](https://github.com/sholehamed/foundation-backend/pull/11) |
| BFF-04/05 callback, BFF session and revocation | Planned | [Backend roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md) |
| BFF-06 Angular migration | Blocked on backend and full-stack E2E | [Browser client contract](architecture/browser-bff-client.md) |

## Current Angular runtime (not yet migrated)

- `src/app/shared/services/auth.service.ts` exchanges username/password with Password Grant.
- `src/app/shared/services/token-storage.service.ts` stores access and refresh tokens.
- `src/app/shared/interceptors/api-auth.interceptor.ts` injects bearer tokens.
- `src/app/shared/guards/system-session.guard.ts` and `tenant-session.guard.ts` use browser token state.
- `src/app/shared/pages/auth/sign-in/sign-in.component.ts` currently validates `returnUrl` strictly and accepts app routes only. **It cannot continue a `/api/connect/authorize` returnUrl**; BFF-03's interactive login continuation therefore requires an explicit dedicated safe flow. Do not loosen the current open-redirect protection or pass OAuth tokens to JavaScript as a shortcut.

## Planned frontend work (only after backend readiness)

1. Define a same-origin deployment/proxy for `/bff/*` and `/api/*`; do not rely on broad cross-origin credential requests.
2. Add a separate OIDC-aware Identity login continuation without an arbitrary cross-origin returnUrl.
3. Implement Signals-backed `AuthSessionStore` by GET `/bff/session`, with 401 and 403 separated.
4. Add CSRF bootstrap `GET /bff/auth/csrf` and Angular XSRF header configuration.
5. Replace login/logout with BFF browser navigation and revocation endpoints.
6. Remove browser bearer interceptor, token storage and Password Grant *only after* real System and Tenant login/refresh/logout E2E passes.
7. Add Playwright coverage: no OAuth token visible in browser storage/network; cross-host tenant cookie isolation, expiration and revocation behavior.
8. After functionality matures, consider Angular library extraction for Core/UI/Shell/Identity/Tenant; not in current phase.

## How to resume

- Read this document and [browser client contract](architecture/browser-bff-client.md).
- Inspect the current backend BFF-03 PR/CI state in GitHub; do not assume historical docs are the latest commit.
- Keep code and documentation changes in the same feature PR.
- No frontend migration PR is open or merged as of this checkpoint.
