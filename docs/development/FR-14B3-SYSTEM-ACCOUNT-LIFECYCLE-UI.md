# FR-14B-3 — Guarded System account lifecycle UI

Development checkpoint: 2026-11-09. Companion to backend PR #98. **Disabled** in all environment variants (dev, prod, isolated BFF Chromium) until explicit rollout approval.

## Changes

- The existing /system/admins/:userId/edit route now points to SystemAccountLifecycleComponent, not the legacy raw User update form. Two independent gates are required: systemAccountLifecycleUiEnabled and systemUiAccessPilotEnabled. The shell also requires a System session and live PAGE permission when the UI access pilot is enabled. The existing catalog page system.admins.edit remains inactive-by-default. The legacy /system/admins/create route is explicitly denied; a reviewed pending-account creation UI remains a separate stage.
- The new editor only reads GET /api/system/Admins/{id}/lifecycle and sends narrow PUT {id}/profile, PUT {id}/state or PUT {id}/lock. It sends exact expectedVersion for optimistic CAS. No username, password, TenantId, roles, permissions or arbitrary User properties are editable. On 409 it informs the user to reload rather than silently overwrite another change. Sensitive deactivate/lock operations require a deliberate confirmation.
- Admin list no longer sends the obsolete blind PATCH state/lock requests. Cell values are read-only status text. Only the new guarded editor action is ever offered; legacy create/delete actions are not linked.
- Unit tests assert all three build variants keep the feature OFF, creation stays denied, edit requires its explicit guard, and the HTTP client sends only approved fields with exact CAS version.

## Server and operations

Backend PR #98 remains authoritative: live Master SuperAdmin actor check, System-only and non-self/non-reserved target, actual SQL version CAS, SecurityStamp rotation, future lock end and audit. Frontend checks are user experience controls only and do not replace those server checks.

Enablement requires prior operator-approved System migrations including 20261109070000, validated first-login and recovery path, reviewed Master feature catalog/permission grants and production BFF/proxy session/CSRF testing. Default features stay OFF. No staging or production migration, flag change or grants in this PR.

Legacy System User routes remain unavailable and may have different data types: do not reuse this editor for Tenant or generic System Users without a separate scoped contract.
