# FR-18A — Control Tower Angular experience / screen and API integration contract

**Date:** 2026-11-11  
**Status:** DESIGN ONLY. No Control Tower component, route, API client, chart, dashboard or permission has been implemented by this document PR.  
**Depends on:** [Backend architecture](https://github.com/sholehamed/foundation-backend/blob/main/docs/architecture/control-tower-observability.md), [contract](https://github.com/sholehamed/foundation-backend/blob/main/docs/reference/control-tower-telemetry-contracts.md), [implementation roadmap](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-18-CONTROL-TOWER-ROADMAP.md).

## Product goal and experience principles

The user of System Administration must be able to follow one live, authorized request through **Browser -> BFF -> HTTP -> CQRS Handler -> Domain step -> EF Core/Dapper/SqlClient SQL -> response**, inspect actual timing and SQL fingerprint/approved metadata, know what failed or rolled back, and view *explicitly approved safe* request/response/DTO values. Tenant identity is derived by the backend. `traceId` is a support correlation key, never an access credential.

Visual goal: compact modern System command center, RTL-first and Persian UI, restrained plum/rose accents matching FR-17F-1 design, high-information-density but legible. Light/dark themes, responsive desktop/tablet/mobile, per-user accessible and keyboard operable. No fabricated graphs or fallback data in production. `Intl.DateTimeFormat('fa-IR-u-ca-persian')` displays server UTC timestamps as Jalali with explicit chosen display zone; elapsed duration is always numerical milliseconds independent of display zone.

The new feature is System-owned. Tenant Admin neither edits central menu nor reads cross-Tenant telemetry. Navigation follows existing `systemFeatureRouteSegments` and the backend dynamic Feature Registry; do **not** hard-code a UI privilege or insert a route without central manifest/permission/seed integrity approval.

## Information architecture (proposed future lazy routes)

| Route (planned, not yet registered) | View | Main purpose |
| --- | --- | --- |
| `/system/control-tower` | Live Overview | Services + ingestion health, requests/sec, errors and P50/P95/P99, dependencies, resource saturation |
| `/system/control-tower/requests` | Request Explorer | Search/sort/page server-returned traces by TraceId, service, route template, HTTP status, duration, time and authorized Tenant scope |
| `/system/control-tower/requests/:traceId` | Request Inspector | Waterfall + safe request/response metadata, handler stages, SQL/HTTP deps, errors, retry/rollback; redaction and partial indicators |
| `/system/control-tower/sql` | SQL Analyzer | Fingerprint groups, most frequent/slow, possible N+1, DB health and aggregate Query Store references |
| `/system/control-tower/errors` | Error Explorer | Group exceptions, rate, sample traces and statuses without exposing secrets |
| `/system/control-tower/services` | Service Health | Runtime CPU/GC/ThreadPool, health/readiness, collector queue/drop rates |
| `/system/control-tower/tenants` | Tenant Diagnostics | Privileged scoped view, explicit Tenant selector; no automatic leak from a trace label |
| `/system/control-tower/diagnostics` | Diagnostic Sessions | Approved, time-bounded capture rules and audited session lifecycle |
| `/system/control-tower/alerts` | Alerts | Rule and incident views, future Notification Center linkage |
| `/system/control-tower/audit` | Diagnostic Access Audit | Who viewed/exported/started sensitive diagnostics and policy revisions |

Release **first** the minimal routes Overview/Requests/Request Detail, then SQL read view only when real SQL instrumentation is available. Don't publish unimplemented deep links, nav entries or widgets.

## Primary dashboard layout

Desktop:
- Top breadcrumb `سیستم / مرکز پایش`, title `مرکز پایش و عیب‌یابی`, environment indicator (actual server environment), data freshness and manual refresh with a bounded time range picker (default recently observed range, not fake "online").
- Service health row with actual states `Healthy/Degraded/Unavailable/Unknown`; don't call missing telemetry `healthy`.
- KPI cards: HTTP request rate, error rate, latency P95 (plus P50/P99), top slow endpoints, SQL latency/timeouts only if instrumented, ingestion drop rate, and active explicit diagnostic sessions. Card skeletons before first response; `no data` vs `collector disconnected` separated.
- Latency and error time-series use real server buckets and unit labels; no chart on empty/unsupported series.
- List of recent slow/error traces with TraceId (copy), route, Tenant scope when allowed, status, duration, start time, short safe error code.
- Right-side system events: top regressions, failure clusters, alert incidents (when future Alerting is deployed).
- Explicit source links/graph completeness; never assume every SQL call can be recovered without a span.

Mobile: KPI cards stack in two/one columns, trace list becomes compact cards, filter drawer replaces horizontally scrolling unbounded filter bars; detail timeline horizontally scrolls inside its own viewport, not global body. Tables remain useful with server paging and narrow-priority columns.

## Request Explorer: search/filter/query plan

- Inputs: W3C TraceId exact 32 lowercase/uppercase hex normalized, service enum from backend, `httpRoute` source-authorized key, safe status code/class, duration minimum/maximum, date-time from/to UTC transmitted, TenantId selected from **authorized System UI** only. Never use arbitrary URL, raw SQL string, customer text, authentication token or free-form Loki syntax.
- Query APIs are planned `GET /api/system/control-tower/traces` and `.../{traceId}`; always use BFF HttpClient/same-origin/anti-CSRF server session rules and server-side read grants. Backend enforces input caps and honest `403`/not-visible `404`.
- Keep filters in Angular query params only if non-sensitive; TraceId itself can appear in URL but reveals no data without separate authorization. Tenant IDs/PersonalData/filter with secrets do **not** go to analytics, screenshots or localStorage. Avoid saved searches until explicit data retention design.
- Debounce text/search, cancel previous HTTP observable on filter change, server-side page tokens only, explicit cost/time-window validation errors.
- Empty result message: `در بازه انتخاب‌شده داده‌ای ثبت نشده`, but only if server returned a successful fresh query. Unavailable message: `سرویس پایش در دسترس نیست`; sampled out and expired marked separately. Refresh never claims recovered lost telemetry.

## Request Inspector / Waterfall

Header with W3C TraceId copy, service/route/method/status/duration, trustworthy authenticated Tenant and User *only with granular permission*; back to filters; trace retention/completeness badge. Never reveal access to a guessed trace merely by knowing ID.

Suggested tabs: `خلاصه`, `مسیر اجرا`, `SQL`, `ورودی و خروجی مجاز`, `لاگ‌ها و خطاها`, `وابستگی‌ها`.
- Summary: HTTP method/template, success/error class, sanitized response status, time, trace origin, number of spans and services, slowest measured step, collector status.
- Waterfall: virtualized expandable tree based on `spanId/parentSpanId/links`; horizontal bars positioned from **actual offset from root start**, length actual duration; overlapping spans allowed and displayed, no sum-as-wall-time. Visually distinguish application, HTTP client, DB, cache, job, errors, retries, missing parents/sampled child.
- Span details: safe diagnostic attributes; UTC start, relative offset, elapsed/self time (if backend actually computed), source operation, status, bounded events, exception code, truncation flags; no arbitrary raw exception.Message/StackTrace for an unprivileged viewer.
- SQL tab: Command method/source, fingerprint, duration, actual failure/retry, sanitized `normalizedSql` if policy allows, safe param descriptors, rows affected only if observed. Query Store plan/waits explicitly labelled as **aggregate, approximate correlation**.
- Input/output tab: two safe JSON viewers only where backend says `Captured`; otherwise precise `Redacted`, `NotEnabled`, `Truncated`, `Expired` or `Unavailable`. Never attempt to reconstruct missing bodies from Browser cache or Identity data.
- Errors: grouped safe error codes and linked spans/logs; operator must get elevated permission + audited read to see extra restricted diagnostic fields.
- Span nav is keyboard accessible; use safe text rendering and syntax-highlighting without untrusted innerHTML. Large SQL/output streamed/paged/truncated with explicit budget.

## SQL Analyzer

A separate `FingerprintSummary` read model with `fingerprint`, `sampleCount`, `mean/p95 duration`, `errorCount`, `timeoutCount`, `first/last seen`, `queryStoreLinkStatus`; all based on actual instrumented data and labelled as *sampled* if spans were sampled. SQL text available only through separate authenticated detailed view and only after redaction. N+1 is `potential issue` based on repetitive fingerprint within one trace, not an automated certainty.

No SQL editor, Execute/Cancel Query buttons, or Query Plan force UI in the Control Tower MVP. Query Store aggregate figures (if approved by DBAs) cannot be presented as the exact HTTP request's plan.

## Capture Policies / Diagnostic Sessions UI

Later phases only:
- Source-owned endpoint selector and service selector (not free-form pattern injection), Standard/Detailed, authorized safe field profiles, sample rate, TTL, max request count, max bytes, apply review diff and audit.
- Session activation must show exact Tenant/Endpoint/time scope, reason and approver; stop action with confirmation and visible audit status. No "record everything for everyone" switch.
- Permanent forbidden fields are never shown or enabled even for System Admin.
- Local UI actions are not authoritative: BFF/Backend validates role, source-owned definition, scoped approver and concurrent policy version. `401/403/409/429` show appropriate states; do not optimistically mark capture active until backend confirms.

## Permission integration design

Follow central System Feature Registry and menu patterns used by `src/app/features/system/system.routes.ts` and `system-feature.manifest.ts`:
- Proposed future route segment: `controlTower: 'control-tower'` in route-only frontend manifest, corresponding backend-owned `SYSTEM.CONTROL-TOWER...` contract and code-owned Resource/Permission. Do not create a disconnected static route/permanent menu to bypass central permissions.
- Existing `systemSessionGuard` and `systemAllUiAccessGuard` remain. Nested sensitive tabs/buttons also require `*systemCan` (backend owned page/action keys), with final backend live authorization on every data read.
- No default Tenant admin access. Server prevents trace visibility across Tenant boundaries even if frontend filter is manipulated.
- Bootstrap new installation reviewed System Admin grants but no automatic grant restoration on existing databases.

## View states, accessibility and test matrix

Every page and card supports `Loading`, `Captured`, `NoData`, `PartiallyCaptured`, `SampledOut`, `Redacted`, `NotEnabled`, `Expired`, `Unauthorized/Forbidden`, `Unavailable`, `Error`, `Retry`.
- Redacted fields never rendered as empty strings and should not expose original secret length.
- Optional backend fields must not appear as `0` without data; no fake charts or "all services healthy" if the backend is missing.
- Browser requests must never send JS bearer tokens under BFF mode; no telemetry backend API keys in frontend source or localStorage.
- ISO UTC wire contract; Jalali localized display, accessible numeric duration units and timezone display. Keyboard-focused tree + search + timeline and screen reader status changes.
- Source-backed response fixtures only in tests and Storybook-like internal design previews, never user-facing "live" dashboard.
- E2E coverage: real BFF session, System user allowed; Tenant denies; System user denied granular SQL read; forged TraceId/tenant query no leak; opaque pagination token invalid fails; storage outage yields `503` not false zero; complete vs partial trace; secret masked; mobile layout; copy TraceId; context lost when auth expires.
- Performance: large trace >500 spans virtualized, no unbounded Angular change detection loops; cancellation on route change; avoid auto-refresh while tab hidden or user is inspecting fixed trace.

## Page design tokens and component plan

Visual direction compatible with existing clean Foundation dashboard (warm rose/plum with neutral background), not a separate themed admin application:
- `ControlTowerShellComponent`: breadcrumb + nav + range/filter context and permission state.
- `TelemetryOverviewComponent`: summary, health strip, timeline panels and trace shortlist.
- `TraceExplorerComponent`: bounded search, server pagination, table/cards.
- `TraceInspectorComponent`: waterfall, span detail, links, errors.
- `SqlFingerprintExplorerComponent`: slow/frequent grouped query aggregates.
- `DiagnosticPolicyComponent`: future reviewed capture policies.
- Shared `TelemetryStateComponent` for genuine incomplete/unavailable/expired.
- `ControlTowerApiService` typed contract, read-only initially; no provider-specific PromQL/LogQL names in Angular.

## Milestones

- **FR-18A docs:** UX blueprint checked in, status not implemented.
- **FR-18E initial UI:** after FR-18B/C/D emitting real traces, and backend privileged facade available, build Overview/Request Explorer/Trace Inspector with honest states.
- **FR-18F/G additions:** safe body field view, SQL tuning, diagnostic sessions, alert pages when their server capabilities are genuinely implemented.
- **FR-18H:** real hosted Staging, performance/permission/security/browser/mobile validations and release sign-off.

No route/component changes in FR-18A documentation-only PR.
