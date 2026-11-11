- [FR-17B-2C — immutable published Plan lock UI and new-version-only flow](development/FR-17B2C-PUBLISHED-PLAN-LOCK-UI.md)
- [FR-17B-2B — System Admin Plan Catalog editor and publication review](development/FR-17B2B-SYSTEM-PLAN-CATALOG-UI.md)
- [FR-17B-2A — DB-published plan cards and signup selection](development/FR-17B2A-DYNAMIC-PUBLIC-PLANS-UI.md)
# Foundation Frontend Documentation

- [Frontend project continuity and current BFF status](PROJECT-STATE.md)

- [Browser authentication contract](architecture/browser-bff-client.md)
- [System Admin page audit](SYSTEM-ADMIN-PAGE-AUDIT-2026-10-24.md) (legacy historical evidence, not current Foundation readiness)

Primary architectural authority: [Backend ADR-0001](https://github.com/sholehamed/foundation-backend/blob/main/docs/decisions/ADR-0001-browser-bff.md) and [HTTP contract](https://github.com/sholehamed/foundation-backend/blob/main/docs/reference/browser-auth-contract.md).

## Policy

- Documentation change goes in the same PR as code change, except initial architecture ADR.
- Source paths, test paths, behavior and implementation status must be kept current.
- Avoid duplicating generated OpenAPI details in Markdown. Prefer Mermaid source diagrams when useful.

- [FR-04B — Dynamic current-user Sidebar](development/FR-04B-CURRENT-USER-SIDEBAR.md)

- [FR-03A — Angular feature manifest and reviewed registry UI](development/FR-03A-FEATURE-REGISTRY-UI.md)

- [FR-03B-1 — Validate System routes from backend manifest](development/FR-03B1-BACKEND-MANIFEST-VALIDATION.md)

- [FR-03B-2 — All System routes bound to Registry route-only index](development/FR-03B2-SYSTEM-ROUTES.md)

- [FR-05B — Angular actual nested-route discovery and Registry v2 validation](development/FR-05B-NESTED-UI-ROUTES.md)

- [FR-06B — Live System UI route/action permission pilot](development/FR-06B-LIVE-UI-ACCESS-PILOT.md)

- [FR-07B — Full System live UI route/action guards (opt-in)](development/FR-07B-ALL-SYSTEM-UI-GUARDS.md)

- [FR-08A — System Administrator dashboard with real server metrics](development/FR-08A-SYSTEM-DASHBOARD.md)

- [FR-08B — Tenant Admin read-only workspace starter](development/FR-08B-TENANT-WORKSPACE.md)

- [FR-13B-1 — inactive Tenant member creation form](development/FR-13B1-TENANT-INACTIVE-MEMBER-UI.md)

- [FR-13B-2 — Tenant invitation + activation UI](development/FR-13B2-TENANT-INVITATION-ACTIVATION-UI.md)

- [FR-13B-3 — Tenant first login with temporary password](development/FR-13B3-FIRST-LOGIN-UI.md)

- [FR-13B-3B — unified Tenant Login and automatic password change UX](development/FR-13B3B-UNIFIED-LOGIN-UX.md)

- [FR-13B-3C — Identity-host BFF mandatory password change](development/FR-13B3C-IDENTITY-BFF-LOGIN-UI.md)

- [FR-13B-3A — Optional Tenant staff email and one-time password UI](development/FR-13B3A-EMAILLESS-STAFF-UI.md)
