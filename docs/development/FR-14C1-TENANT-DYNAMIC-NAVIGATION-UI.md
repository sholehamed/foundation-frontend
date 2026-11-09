> **Architecture clarification (2026-11-10).** The read-only Tenant dynamic menu remains valid: it displays only entries from the **System Admin-owned central Menu Registry**, filtered by effective Tenant PAGE permissions. References below to Tenant-owned menu customization were superseded.

# FR-14C-1 — Tenant dynamic navigation pilot (disabled)

Date: 2026-11-09. Companion to backend FR-14C-1.

## Intent

The Tenant workspace currently has a static header with authenticated workspace links and three dynamic, live-permission-gated administration links. The existing shared database Menu catalog is global rather than per-Tenant. This pilot connects a separate, **read-only** Tenant navigation projection to Angular without granting any extra access or enabling new menu editing.

## Flow

- Frontend flag `tenantDynamicNavigationPilotEnabled` is **false** in development, production and isolated BFF Chromium e2e environments. When OFF the existing header and the existing `/tenant/workspace/ui-access/me` PAGE evaluation remain unchanged.
- When enabled through an independently approved rollout, the workspace shell fetches `GET /api/tenant/workspace/navigation/me` through the ordinary Tenant-aware HttpClient. There are NO TenantId, branchId, userId, RoleId, permissions or secrets in the request.
- The server validates the subject, real active home Tenant and live permissions (including direct Deny, group/role assignment and inherited Owner fallback) and returns category/title/route/icon/externalUrl/childs only. It supports the six code-owned root routes `/dashboard`, `/dashboard/business`, `/dashboard/branches`, `/dashboard/members`, `/dashboard/roles`, `/dashboard/groups`; the three privileged pages require the corresponding live PAGE rights. Unknown routes are omitted.
- Angular displays the returned tree recursively; with no entries or an API error it renders **zero** dynamic menu items. It never falls back to a static privileged directory link when this mode is ON. The separate brand link to the authenticated workspace dashboard remains usable.
- External links are displayed only from the server's validated HTTPS links, opened in a new tab with `rel=noopener noreferrer` and no referrer. Angular links are a UX hint, not authorization: existing canActivate PAGE guards and .NET API checks remain essential.

## Acceptance and constraints

Unit tests cover the default OFF invariant in all environments, typed response/no user-supplied IDs, recursive nested rendering, no client-side fallback after server revocation and isolated external links. The existing Chromium BFF safety workflow must stay green; no claim of real deployed browser testing is made.

The backend Menu/MenuCategory catalog has no TenantId and no branch binding today. This slice **does not** solve tenant-owned menu customization, branch-scoped membership, grant assignment or the global menu editor. Further FR-14C slices must first define an owned schema, migration preflight, delegation rules and a reviewed operator rollout. No Staging/Production deployment, catalog Apply, grants, SQL migrations or feature toggle changes here.
