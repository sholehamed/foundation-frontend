# FR-14B-2B — Root System first-login in existing Login UI

2026-11-09. This UI is **OFF** in both shipped environment files.

System initial-credential issuance is **not** exposed in Admins CRUD. The existing System Login form detects only the short random 4×6 initial-secret format; under systemFirstLoginEnabled and exact HTTPS root-domain with a same-origin API, it calls POST /api/System/Auth/system-first-login/resolve. Otherwise it continues the unchanged AuthService OAuth login. Tenant first-login and Identity-host BFF first-login remain distinct.

A verified change-only server response contains a challenge and expiry, not a JWT or Identity/BFF session. The Login component clears the initial password immediately and keeps only the challenge in memory, showing the existing new password and confirmation form. It POSTs to /api/System/Auth/system-first-login/complete using credential-free, same-origin, no-redirect, no-referrer fetch. Success must explicitly return passwordChanged=true, requiresRelogin=true; the challenge/form are cleared and the UI returns to /system/auth/login?passwordChanged=1 without performing auto-login.

Security invariant tests cover default-OFF in both environment profiles, exact host and HTTPS, no third-party origin, request credentials omit, safe parsing of decision and rejection of misleading authenticated response.

Companion backend PR #97 adds new SQL-backed one-time challenge and a separate Admins issuance endpoint. Migration, API permission catalog/grants, first-login flag cutover, Staging/Production, real deployed browser/proxy verification and reserved SuperAdmin role assignment are not part of this UI PR. BFF System identity-host first-login is a separate release gate.
