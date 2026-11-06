# Foundation Frontend — project state and handoff

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


> Updated: 2026-11-06. Integration branch: `main`.
> Verify linked PR heads and CI before continuing. Earlier checkpoints remain in Git history.

## Current implementation

Angular still uses Password Grant, browser token storage and bearer interception for normal application login. Full BFF migration (BFF-06) has not started.

[Frontend PR #8](https://github.com/sholehamed/foundation-frontend/pull/8) merged the separate, allowlisted Identity UI Authorization Code continuation. It uses same-origin CSRF and interactive login before navigating back to the authorization endpoint. [CI 42140641581](https://github.com/sholehamed/foundation-frontend/actions/runs/42140641581) passed 22 tests in 12 files and the development build. This does not migrate application guards or token storage.

## Backend dependency checkpoint

| Capability | Verified state |
| --- | --- |
| Protected server ticket, interactive Identity cookie, code + PKCE | Merged BFF-01 through BFF-03 |
| Actual Identity to BFF protocol flow | [PR #22](https://github.com/sholehamed/foundation-backend/pull/22) merged at `f53c5e04d899b09d33133f57beafe234b671501c`; two real TestServers with OpenIddict discovery, code exchange, UserInfo and host-bound cookie. [CI 42198862063](https://github.com/sholehamed/foundation-backend/actions/runs/42198862063): 58 BFF + 48 Identity tests |
| Read-only session | Merged [PR #19](https://github.com/sholehamed/foundation-backend/pull/19): cookie-only `GET /bff/session`, safe JSON, no-store, 401/403 |
| CSRF and current-session logout | [PR #23](https://github.com/sholehamed/foundation-backend/pull/23): `GET /bff/auth/csrf` and `POST /bff/auth/logout`; server ticket removal with host, Origin/Fetch Metadata and antiforgery validation. Check PR for current acceptance/merge status |
| Remaining lifecycle | Live user/tenant/stamp/grant revalidation, logout-all, upstream token revocation, idle/absolute lifetime and refresh coordination, durable multi-node cache/keyring |
| Browser/deployment acceptance | Actual browser, CAPTCHA/login UI, SQL Server and trusted reverse proxy still unverified |
| Angular BFF-06 | Blocked on lifecycle and browser acceptance; [issue #10](https://github.com/sholehamed/foundation-frontend/issues/10) |

The two-TestServer flow excludes the real password/CAPTCHA UI and browser cookie enforcement. Do not call it deployed browser E2E. BFF remains disabled by default.

## Accepted boundaries

- Complete useful pages and workflows before extracting Angular packages.
- Keep System Admin and Tenant Application identity and routing separate.
- Target browser auth uses a Secure/HttpOnly/host-only BFF cookie and server-held OAuth credentials.
- Angular and its BFF/API must share an exact origin; use relative `/bff/*` and `/api/*` behind a proxy.
- Do not enable global credentialed CORS or migrate existing login prematurely.
- Both original F00 PR #2s remain open by prior decision.

## Next implementation sequence

1. Backend: revalidate current user, active tenant, security stamp and grants at the cookie boundary with a defined maximum staleness; high-risk operations need fresh checks. Keep BFF and Identity module boundaries separate.
2. Backend: account-wide revocation, upstream token revocation, refresh coordination and bounded idle/absolute expiration. Test concurrent logout/renewal so a stale renewal cannot resurrect a removed ticket.
3. Deployment: durable shared cache/keyring, restart/outage behavior, trusted forwarded headers and SQL Server validation.
4. Frontend: gated Signals session facade, relative requests, CSRF bootstrap, contextual login and POST logout; separate 401 from 403.
5. Cross-repo browser tests for System/Tenant login, reload, logout, expiration and revocation; inspect browser storage and network for OAuth credential exposure.
6. Only after acceptance remove browser Password Grant, token storage and bearer interception; preserve native/service authentication.

## Existing files to migrate later

- `src/app/shared/services/auth.service.ts`
- `src/app/shared/services/token-storage.service.ts`
- `src/app/shared/interceptors/api-auth.interceptor.ts`
- `src/app/shared/guards/system-session.guard.ts`
- `src/app/shared/guards/tenant-session.guard.ts`
- `src/app/app.config.ts`
- `playwright.config.ts` and `e2e/`

## Continuity references

[Backend state](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-STATE.md) · [Roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/PROJECT-ROADMAP.md) · [ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md) · [Browser client contract](architecture/browser-bff-client.md) · [Identity UI handoff](development/BFF-04-IDENTITY-UI-HANDOFF.md).

This documentation-only continuation does not change Angular runtime behavior. Read the current checkpoint before historical implementation notes.
