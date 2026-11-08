# FR-10A — Branch management in Tenant workspace

Date: 2026-11-08. Companion to Backend PR FR-10A.

The existing /dashboard/branches page remains tenant-scoped and readable for an authenticated owning tenant. A live admin-capabilities response now includes `canManageBranches` (not just canViewAdministration). Add/Edit controls render **only** when this is true. Every mutation is independently authorized by Backend with live local Owner role and writable ActiveTenantId, so the button state is UX-only.

- A validated inline Angular reactive form allows Name, City, Address and optional Phone.
- POST /tenant/workspace/branches creates a new non-main branch; PUT /tenant/workspace/branches/{id} updates only these fields. The browser never sends TenantId or IsMain.
- Existing main branch can update contact/location only. No delete or main-branch reassignment actions are shown.
- Errors and denied writes do not claim success; 403 hides write controls, clears stale branch data and closes the form; successful writes refresh the tenant's owned branches. Read-only users keep the existing list view.
- Requires matching backend FR-10A. Login, System Admin, billing, BFF and Feature Registry flags are unchanged.

Not a finished tenant permissions hierarchy: granular Owner/Branch/Own/Child policies, tenant resource PAGE/ACTION registry, audit views, SQL concurrency and real browser staging E2E are still pending. Related: backend issue #44.
