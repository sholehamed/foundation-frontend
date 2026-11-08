# FR-13B-3 — first login with a one-time temporary password

Date: 2026-11-09. Companion to Backend [PR #77](https://github.com/sholehamed/foundation-backend/pull/77), [Issue #76](https://github.com/sholehamed/foundation-backend/issues/76), and FR-13 #70.

## Owner flow: deliberate one-time physical handoff

- The existing `/dashboard/members` directory gets an **Issue initial password** action only for inactive staff, only when both the Angular `tenantFirstLoginEnabled` flag and the Backend's `canIssueTemporaryPassword` capability are true. Backend requires live local Owner, writable home Tenant and the independently registered `TENANT.MEMBERS.ISSUE-TEMP-PASSWORD` ACTION. No role or tenant ID comes from Angular.
- The button rechecks `GET /tenant/workspace/admin-capabilities` **immediately before** issuing the credential. HTTP `POST /api/tenant/workspace/members/{id}/temporary-password` has body `{}`.
- The response includes `temporaryPassword` and `expiresAtUtc` **once**. It is held in a transient Angular signal and displayed with explicit handling warning. Close wipes that signal; navigation/destroy discards it. Never persist to URL, localStorage/sessionStorage, clipboard automatically, telemetry or logs. No password-retrieval endpoint exists; for a lost password, Owner explicitly revokes and reissues (old credentials/challenges immediately become invalid).
- This is a high-risk handoff: the first person using an unexpired initial credential could hijack the account. Owner MUST verify the human recipient in person, hand it over privately and revoke/reissue if lost. No shared static password. For remote users, the existing one-time emailed invitation is more appropriate.

## Employee flow: restricted credential proof, NOT an authenticated session

- When the feature flag is ON on a trusted Tenant subdomain, normal `/auth/login` displays a **First login with initial password** link to `/auth/first-login`. This is a separate, unguarded route; do NOT try to use the normal OAuth password grant to log in an inactive User.
- On `/auth/first-login`, the employee enters username and initial password. The UI requires actual HTTPS, a valid Tenant host matching `environment.workspaceBaseDomain` and a same-origin `environment.apiUrl` (reverse proxy `/api`). It sends anonymous `POST /api/public/tenant-first-login/start` with `{tenantSlug,userName,temporaryPassword}` using native `fetch` with `credentials:'omit'`, `mode:'same-origin'`, `redirect:'error'`, `referrerPolicy:'no-referrer'`, `cache:'no-store'`. This *guarantees* no same-origin cookies or OAuth/BFF interceptor. Initial password inputs are cleared after every attempt.
- Successful response `{challenge,expiresAtUtc,requiresPasswordChange:true}` is only an ephemeral **password-change-only challenge** (not OAuth JWT, Bearer header, BFF session or any usable application auth). It is held only in component memory, never Router URL, localStorage/sessionStorage. UI changes immediately to the second form.
- Employee sets a **new, 15–128-character** permanent password and confirms it. `POST /api/public/tenant-first-login/complete` sends `{tenantSlug,challenge,newPassword}` over the same credential-free transport. Backend consumes challenge once in SQL Server transaction, hashes password, activates user, rotates stamps, writes audit. Angular clears the password fields and challenge; only after server confirms `{passwordChanged:true,requiresRelogin:true}` does it navigate to ordinary `/auth/login?passwordChanged=1` for fresh full authentication. It does not create an app session or redirect to dashboard.
- 400/401 expired/used challenge clears secret and returns to first step; 429 and server errors are explicit. Refreshing/closing the tab also discards the challenge; employee must redo initial login while credential remains valid.
- Normal login remains unchanged and refuses inactive members, preserving the separation from restricted proof. Email invitations still work independently.

## Configuration / release gate

- Angular `environment.tenantFirstLoginEnabled=false` by default. Backend `Identity:TenantFirstLogin:Enabled=false` by default. Both must be enabled in a **reviewed isolated staging** deployment, along with matching Backend/Frontend builds, trusted TLS Tenant host, same-origin `/api`, reviewed SQL migration `20261109030000_tenantmemberfirstlogin`, Tenant Registry Preview/Apply (12 code-owned keys) and explicit Owner role grant.
- No Production toggle, migration, user creation or privilege grant is made by code merge. Current default Development frontend `https://localhost:7262/api` is intentionally not a same-origin Tenant browser deployment.
- Existing rate-limiters are per-process; enforce distributed Gateway throttling and monitor five failed attempts per credential before enabling in multi-node Production. Disable HTTP response body logging and redact credential/challenge/password payloads from tracing/WAF/support data.
- Tests: util contract (cookie-free and no redirect), Owner role and one-time reveal, real Angular two-step state transition, expiry, no session, and explicit ordinary login redirect. They do NOT establish a deployed HTTPS multi-account end-to-end acceptance. Browser/SQL staging evidence remains required.

**Never label a short-lived challenge as a full login, and never grant the restricted visitor access to dashboard/roles/APIs before password change.**
