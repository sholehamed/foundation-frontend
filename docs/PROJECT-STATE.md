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
| BFF-03 code + PKCE and scoped Identity principal | **Merged / 47 tests passed** | [PR #11](https://github.com/sholehamed/foundation-backend/pull/11), merge `c201e4c67d18c9d7896887a688eb31d3340d7930`, [CI run 42130167589](https://github.com/sholehamed/foundation-backend/actions/runs/42130167589) |
| BFF-04/05 callback, BFF session and revocation | **BFF-04 return-URL validator merged; no browser session yet** | [Issue #12](https://github.com/sholehamed/foundation-backend/issues/12), [merged return URL security PR #14](https://github.com/sholehamed/foundation-backend/pull/14), [Backend roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md) |
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
- Inspect current backend BFF-04 PR/CI state in GitHub; do not assume historical docs are the latest commit.
- Keep code and documentation changes in the same feature PR.
- No frontend migration PR is open or merged as of this checkpoint.

## Verified backend handoff after BFF-03 (2026-11-06)

- [BFF-03 merged PR #11](https://github.com/sholehamed/foundation-backend/pull/11) with OpenIddict authorization code / PKCE, scoped Identity cookie revalidation and TestServer protocol tests (41 Identity and 6 BFF tests passed). This proves **the Authorization Server side only**.
- [Backend docs checkpoint PR #13](https://github.com/sholehamed/foundation-backend/pull/13) merged; see backend [PROJECT-STATE](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md) for the canonical status.
- [BFF-04 Issue #12](https://github.com/sholehamed/foundation-backend/issues/12) is next: BFF confidential OIDC challenge/callback, server-side BFF session cookie, safe Identity login continuation; [Merged PR #14](https://github.com/sholehamed/foundation-backend/pull/14), commit `53732242450bd90c206e29738007372bbe2dde1b`, contains only a conservative local returnUrl validator and tests ([CI 42131501508](https://github.com/sholehamed/foundation-backend/actions/runs/42131501508): 35 BFF + 41 Identity green).
- No Angular login or package extraction change is authorized/needed yet. Preserve current Password Grant until backend session endpoints and E2E acceptance.


## BFF-04 Identity login continuation (active branch, not merged)

- Branch: `feat/bff-04-safe-identity-login-continuation`.
- The existing Identity sign-in UI now recognizes only a tightly validated same-origin `/api/connect/authorize` continuation for the configured `foundation-browser-bff` client: Authorization Code, S256 PKCE, unique state/nonce/security parameters, HTTPS `/signin-oidc` callback, matching System/Tenant context and tenant slug.
- For that continuation only, Angular calls `GET /api/system/Auth/csrf` and `POST /api/system/Auth/interactive-login` with credentials + antiforgery. It then performs a full-page navigation to the same-origin authorization endpoint. No OAuth token is stored in JavaScript.
- Normal sign-in without a BFF authorization return path still uses the existing Password Grant and local token storage. No guards/interceptors/API token flow have been migrated.
- Unit tests cover accepted/rejected continuation URL shapes. This branch is not merged or CI-verified yet.
