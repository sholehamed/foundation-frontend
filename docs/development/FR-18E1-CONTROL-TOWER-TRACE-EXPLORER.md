# FR-18E-1 — RTL Control Tower Trace Explorer + first real Waterfall

**Date:** 2026-11-11  
**Status:** Angular PR pending CI and backend PR contract certification.

## Scope implemented

- New lazy System Admin route `/system/control-tower` and matching Angular executable route segment in `systemFeatureRouteSegments`. Existing root `systemSessionGuard` and `systemAllUiAccessGuard` apply unchanged. The Backend Registry owns the `system.control-tower` Resource/PAGE and live read Permission `CONTROL-TOWER.TRACES.READ`; Angular does not define a separate permission catalog.
- Typed `ControlTowerTraceService` calls **only** `GET {environment.apiUrl}/system/control-tower/traces/{traceId}` after enforcing exactly 32 hex digits. No raw query parameters or Tempo URL/credential/OTLP endpoint exposed to the browser. Existing Angular API auth interceptor remains unchanged.
- Standalone OnPush `ControlTowerPageComponent` with RTL responsive page, input validation, lookup and safe refresh, URL `?traceId=` only (not bearer/session identifiers), local calendar/date display through `Intl.DateTimeFormat('fa-IR-u-ca-persian')` with explicit UTC, response-derived duration/SQL/error counts, trace completeness state and accessible Waterfall rows with real start/duration offset.
- Filter `all/handler/sql/errors`, selectable Span detail with allowlisted attributes **from Backend only**, copy TraceId, typed accessible status messages for 400, 401/403, 404, 429, 503 and failed/partial responses.
- Existing System Dashboard gets a permission-projected `Control Tower` shortcut and the global System navigation gets the centrally seeded Menu on fresh backend installs; *no Tenant authoring of System menus*.
- No fabricated charts, mock runtime activity, SQL text, DTO inputs/outputs, request body, raw OTLP, trace search by arbitrary expression, user/tenant identifiers, or silent network fallback. A 404 means `NotRetained`, not zero activity; API disabled/collector unavailable is a named 503 state, not a healthy empty trace.
- Lightweight responsive SCSS uses existing surfaces and modest colors; no new chart dependency. Large traces are capped at 256 spans server-side and the UI reports truncation, not silently reducing the array.

## Acceptance

- Angular build/TypeScript and unit tests, including `control-tower-trace.service.spec.ts` which asserts fixed API URL, GET-only, no extra params, no direct Tempo destination, malformed TraceId rejection.
- Existing FeatureRegistry Angular route/manifest tests remain valid: one new root page. The Backend Feature Registry matches the same root key `system.control-tower`; its independent CI tests assert source ownership, first-install grants and documented API contract.
- Backend real signed System JWT + SQL -> Collector -> Tempo E2E additionally calls **the protected read facade**, checks 200, unauthorized 401, Tenant 403 and invalid-ID 400.
- PR-head/main Angular CI and backend CI are independent merge gates. Do not assume passing one means the other is green.

## Limitations and future stages

- This slice does **not** implement a durable audit log for sensitive trace-detail access, a fully deployed production private Tempo service, full BFF Cookie/OIDC browser trace test, range search, dashboards/alerts, or approved detailed input/output capture. These are FR-18E-2, F, G and H.
- Existing Production System roles are not silently granted new read access. First-install seeded SuperAdmin gets it by verified central bootstrap. Existing installs must explicitly review/apply the registry and grant.
- The URL query contains only an opaque TraceId, not a secret payload. Treat it as correlation, not proof of caller authorization.
- No direct production browser connection to Collector, Tempo, metrics, logs or SQL Server. Telemetry remains isolated from business data at storage boundary.
