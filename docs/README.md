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
