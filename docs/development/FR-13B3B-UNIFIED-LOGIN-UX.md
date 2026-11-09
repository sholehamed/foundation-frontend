# FR-13B-3B — unified Login, automatic forced password change

Date: 2026-11-09. Backend [FR-13B-3B #79](https://github.com/sholehamed/foundation-backend/issues/79), parent [FR-13 #70](https://github.com/sholehamed/foundation-backend/issues/70). Companion to [Backend design](https://github.com/sholehamed/foundation-backend/blob/feat/fr-13b3b-unified-tenant-login-decision/docs/development/FR-13B3B-UNIFIED-TENANT-LOGIN.md).

## Visible experience

- Employee always opens the normal Tenant `/auth/login` page, enters username, password and existing CAPTCHA. **No separate "first-time login" choice** is shown in the regular Tenant path.
- Standard passwords go immediately through the unchanged AuthService normal login and CAPTCHA; no extra temporary-password HTTP calls or impact on the first-login 5/min per-IP throttle.
- Only the exact server-created initial credential shape (`XXXXXX-XXXXXX-XXXXXX-XXXXXX`) triggers a transparent check at `POST /api/public/tenant-login/resolve`. The Backend, *not Angular*, verifies the credential against a hashed unexpired temporary password in the correct Tenant. Invalid/unknown/expired credentials return generic `continue_login`; the regular authenticator still decides whether normal login succeeds. This never issues normal JWT or BFF session.
- On a verified `{status:'password_change_required',challenge,expiresAtUtc}`, the **same Login page** swaps its form to mandatory new password + confirmation. The challenge is held exclusively in component memory, never in URL, localStorage, sessionStorage, Redux, telemetry, or an OAuth token.
- The new password is submitted to existing `/api/public/tenant-first-login/complete` with native `fetch`, `credentials:'omit'`, no redirects, same-origin HTTPS and no referrer, with no OAuth/BFF interceptor. On `{passwordChanged:true,requiresRelogin:true}`, all challenges/passwords are cleared and the employee goes back to `/auth/login?passwordChanged=1` for **a new normal login**. No direct dashboard access.
- The historical `/auth/first-login` route is retained as a compatibility path but isn't advertised from standard Login. The currently default-OFF **external Identity-host BFF interactive login pilot** uses a separate origin and signed OIDC continuation: this change does not modify that pilot's behavior. Do NOT loosen the secure Tenant-host check or attempt wildcard CORS to force BFF parity; stage a reviewed Identity-host BFF integration separately.

## Owner creation

- Existing Tenant member form now offers a prechecked "Issue initial password on create" option **only if** both Angular `tenantFirstLoginEnabled` and live server `canIssueTemporaryPassword` are true. When requested, the Owner form rechecks both `canCreateMembers` and `canIssueTemporaryPassword`, then calls `POST /api/tenant/workspace/members/with-initial-password` with only `{userName,email,firstName,lastName}`.
- Backend enforces BOTH independently registered Owner-only ACTIONs, SQL SERIALIZABLE transaction and append-only `create_inactive` + `temp_issued` audit. It returns one `temporaryPassword` and a strictly inactive new User. Angular shows it in its existing one-time secret view; on close it erases the secret and reloads members. No second API write/partial onboarding. When the option isn't available/selected, old disabled-user creation + email invitation paths remain unchanged.
- The new User is **not Active** for normal login: the initial password is stored as separate hashed, retry-capped, short-expiring credential. Only forced change enables the account; a successful change still leaves it with zero auto grants until Owner assigns role explicitly.
- No shared predictable default password, automatic clipboard copy or secret in local/remote storage.

## Release constraints

- Backend `Identity:TenantFirstLogin:Enabled` and Frontend `tenantFirstLoginEnabled` remain **OFF** by default. Same-origin HTTPS Tenant reverse proxy + approved FR-13B-3 SQL migrations + 12 Tenant catalog definitions + both Owner grants are required for use. No staging or production rollout is performed by a code PR merge.
- Owner must verify person before physically handing off one-time password. 60-minute initial credential, 5 failed attempts; restricted change-only challenge 10 minutes, single use. Actual Staging end-to-end UX and abuse tests are still required. Rate limits are process-local and require gateway/distributed protection in production.
- Email is still required on Tenant member creation due to existing User schema: optional-email follow-up [#78](https://github.com/sholehamed/foundation-backend/issues/78). Do not create fictitious email addresses.
- Frontend unit tests validate normal vs initial credential classification, strict decision shape, one-step Owner issuance, transient secret clearing and permission revoke. Backend disposable SQL suite tests the actual serializable operations. Identity-host BFF acceptance is a separate gate.
