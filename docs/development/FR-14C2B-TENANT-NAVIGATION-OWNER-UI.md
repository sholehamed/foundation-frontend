> **SUPERSEDED (2026-11-10).** Tenant menu editing was removed from active routes because **System Admin owns all Menu definitions**. Tenant Owner only assigns centrally authorized permissions to local roles. This previous UI plan is not valid for rollout; retained as history.

# FR-14C-2B — Tenant Owner navigation editor (UI pilot OFF)

Checkpoint: 2026-11-09. Angular companion to Backend PR #101.

## UX and security contract

A new /dashboard/navigation page manages only Tenant-owned Category and Item metadata:
- Add/rename/reorder/soft-disable categories
- Add/rename/reorder/reparent/soft-disable menu items
- Choose only six reviewed Tenant dashboard routes, or no route for a container
- Confirm destructive visibility changes explicitly
- Show 409 CAS conflicts and require an explicit reload, never silently replace someone else's edits.

The editor never accepts or submits TenantId, UserId, BranchId, role/grant IDs, permission scopes or raw global Menu data. Item category ownership remains immutable; updates never send categoryId. The backend independently validates category and parent membership, exact route authorization, local Owner and MANAGE permission, SQL row versions and atomic audit.

The page is guarded by tenantSessionGuard (existing parent), tenantNavigationOwnerEditorGuard (new), and live PAGE response TENANT.NAVIGATION.READ from /tenant/workspace/ui-access/me. It appears as a standalone settings link only when that permission is live. The page can render read-only metadata if canManage=false; backend still denies writes. No privileged static fallback on UI errors.

The new independent tenantNavigationEditorPilotEnabled flag is **false** in development, production and isolated Chromium BFF configurations. The backend's Identity:TenantNavigation:OwnerEditorEnabled is independently **false**, and owned-menu display flags from FR-14C-1/2A remain OFF. Thus the existing Tenant workspace and global System Admin menu are unchanged.

## Tests and operational prerequisites

Angular unit tests assert all flags OFF, route guard installed, GET no scope params, exact narrow create/update bodies, CAS versions and 409 handling. Full Frontend BFF CI/Chromium must pass before merge. The browser pilot already checks the existing Tenant BFF flow; new editor positive end-to-end **under enabled flags** must be certified separately, not inferred from a regression pass.

Operational order: apply approved 20261109080000 + 20261109090000 migrations in a disposable then approved environment; preview and explicitly apply the new code-owned Tenant navigation READ/MANAGE definitions; verify local Owner and direct deny; enable backend OwnerEditor only in test environment; populate owner-scoped catalog; test full editor/CSRF/BFF/proxy and two-Tenant negative cases; only after a non-empty parity-checked menu, enable OwnedCatalogEnabled and tenantDynamicNavigationPilotEnabled. Do not enable these flags or deploy automatically.

Remaining FR-14C-2C: delegated non-Owner editing, import of legacy global menus with explicit operator review. FR-14C-3: real BranchMembership and branch-aware authorization. **Staging/Production remain deferred**.
