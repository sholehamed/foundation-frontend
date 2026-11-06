# Foundation Frontend — project continuity and BFF status

> Updated: 2026-11-06  
> Repository: `sholehamed/foundation-frontend`  
> Stable integration branch: `main`

Read this before continuing in another chat. The canonical BFF architecture is maintained in [Backend ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md). Backend task-level checkpoint: [PROJECT-STATE](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md), [ROADMAP](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md).

## Current merged status — 2026-11-06

- **Merged:** [Frontend PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) at `e94c144e4293faa297290aa608c5e7409aeaa1c2`. Latest PR-head [CI 42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581): **22 unit tests (12 files)** + Development build passed. Includes a new `Frontend BFF safety CI` workflow in this repository.
- **Scope:** only the old Identity login UI gains a strictly allowlisted OIDC Authorization Code continuation using same-origin CSRF/interactive-login, then a full-page local authorization redirect. Normal sign-in still uses Password Grant and browser localStorage tokens, intentionally unchanged.
- **Security fix:** `AuthService.interactiveLogin` rejects cross-origin `/api` access; use a same-origin `/api` proxy to read the XSRF request token. The global root/tenant initializer duplication has been fixed.
- **Backend dependency:** [Backend PR #16](https://github.com/sholehamed/foundation-backend/pull/16) merged at `c4f6a81c302f3524bed3e58931221874be16928f` (46 BFF and 42 Identity tests green), but actual OIDC callback and BFF cookie E2E is not yet proven, and BFF is disabled by default.
- **BFF-06 migration NOT started:** no `/bff/session` auth store, cookie-only guards, CSRF/logout UI, removal of bearer interceptor or OAuth tokens from localStorage. Do not start until BFF-04 callback and BFF-05 session/revocation + cross-repo E2E are verified.
- **Implementation/operations:** [BFF-04 Identity UI handoff](development/BFF-04-IDENTITY-UI-HANDOFF.md).

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
| BFF-04/05 callback, BFF session and revocation | **BFF-04.2 OIDC client plumbing merged; callback E2E / BFF-05 session API pending** | [Issue #12](https://github.com/sholehamed/foundation-backend/issues/12), [merged return URL security PR #14](https://github.com/sholehamed/foundation-backend/pull/14), [Backend roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md) |
| BFF-06 Angular migration | Blocked on backend and full-stack E2E | [Browser client contract](architecture/browser-bff-client.md) |

## Current Angular runtime (not yet migrated)

- `src/app/shared/services/auth.service.ts` exchanges username/password with Password Grant.
- `src/app/shared/services/token-storage.service.ts` stores access and refresh tokens.
- `src/app/shared/interceptors/api-auth.interceptor.ts` injects bearer tokens.
- `src/app/shared/guards/system-session.guard.ts` and `tenant-session.guard.ts` use browser token state.
- `src/app/shared/pages/auth/sign-in/sign-in.component.ts` now has a **separate** allowlisted OIDC authorization continuation from merged PR #8. Legacy app-route returnUrl validation remains strict; this is not a full browser-session migration.

## Planned full-session frontend work (only after backend readiness; narrow Identity continuation PR #8 is separate)

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
- Draft PR #8 introduces only the Identity UI OIDC continuation; the full Angular BFF migration is not open/merged.

## Verified backend handoff after BFF-03 (2026-11-06)

- [BFF-03 merged PR #11](https://github.com/sholehamed/foundation-backend/pull/11) with OpenIddict authorization code / PKCE, scoped Identity cookie revalidation and TestServer protocol tests (41 Identity and 6 BFF tests passed). This proves **the Authorization Server side only**.
- [Backend docs checkpoint PR #13](https://github.com/sholehamed/foundation-backend/pull/13) merged; see backend [PROJECT-STATE](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md) for the canonical status.
- [BFF-04 Issue #12](https://github.com/sholehamed/foundation-backend/issues/12) is next: BFF confidential OIDC challenge/callback, server-side BFF session cookie, safe Identity login continuation; [Merged PR #14](https://github.com/sholehamed/foundation-backend/pull/14), commit `53732242450bd90c206e29738007372bbe2dde1b`, contains only a conservative local returnUrl validator and tests ([CI 42131501508](https://github.com/sholehamed/foundation-backend/actions/runs/42131501508): 35 BFF + 41 Identity green).
- The Identity UI continuation was subsequently merged in PR #8 (see current checkpoint above). Preserve current Password Grant until backend session endpoints and E2E acceptance.


## BFF-04 Identity login continuation (historical branch snapshot; merged as PR #8)

- Branch: `feat/bff-04-safe-identity-login-continuation`.
- The existing Identity sign-in UI now recognizes only a tightly validated same-origin `/api/connect/authorize` continuation for the configured `foundation-browser-bff` client: Authorization Code, S256 PKCE, unique state/nonce/security parameters, HTTPS `/signin-oidc` callback, matching System/Tenant context and tenant slug.
- For that continuation only, Angular calls `GET /api/system/Auth/csrf` and `POST /api/system/Auth/interactive-login` with credentials + antiforgery. It then performs a full-page navigation to the same-origin authorization endpoint. No OAuth token is stored in JavaScript.
- Normal sign-in without a BFF authorization return path still uses the existing Password Grant and local token storage. No guards/interceptors/API token flow have been migrated.
- Unit tests cover accepted/rejected continuation URL shapes. This branch was subsequently merged and CI-verified; see the current merged status above.

## BFF-04 Angular continuation review checkpoint — 2026-11-06

- [Draft PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) supplies the **Identity UI OIDC authorization continuation only**, not the BFF browser-session migration. Normal login still uses the legacy Password Grant / local token storage.
- `validateBffAuthorizationReturnUrl` accepts only same-origin `/api/connect/authorize` navigation with the configured client, Authorization Code and S256 PKCE, strict state/nonce, HTTPS callback and matching account/tenant context. The backend remains authoritative for registered clients, callback, grants and identity.
- `AuthService.interactiveLogin` requires the Identity UI to share an **exact origin** with its `/api` endpoint; it refuses cross-origin credentialed login. Set `apiUrl: '/api'` behind a same-origin reverse proxy for Identity UI environments. On `https://localhost:4200`, calling `https://localhost:7262/api` directly does **not** meet this requirement. This prevents CSRF-cookie read failures and avoids expanding credentialed CORS.
- Corrected the pre-existing duplicate `TenantContextService.initialize()` startup call (the unconditional initializer ran on root marketing/system pages as well as tenant hosts).
- Corrected a miscopied pre-existing `AdminFormComponent` test import discovered by CI. [Frontend BFF CI 42140302464](https://github.com/sholehamed/foundation-frontend/actions/runs/42140302464): **22/22 tests (12 test files)** and Development build successful.
- `GET /bff/session`, BFF CSRF/logout/revocation, Signals auth store, removal of OAuth tokens from browser storage and full System/Tenant E2E are **not implemented**. Do not switch Angular guards/interceptors from the legacy flow until BFF-05/06 and browser E2E are ready.
