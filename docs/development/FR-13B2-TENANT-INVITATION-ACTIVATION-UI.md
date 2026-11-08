# FR-13B-2 — Tenant invitation and activation UI

Date: 2026-11-09. Companion to Backend [PR #75](https://github.com/sholehamed/foundation-backend/pull/75) and [Issue #74](https://github.com/sholehamed/foundation-backend/issues/74). Parent [FR-13 #70](https://github.com/sholehamed/foundation-backend/issues/70).

## Operational flow

1. A local Tenant Owner with **live** Members.Read + Members.Invite + writable Tenant scope sees an **Invite member** action only on **inactive** member rows in `/dashboard/members`. UI fetches `GET /tenant/workspace/admin-capabilities` both on load and immediately before POST. The backend independently rechecks all grants and exact registered `TENANT.MEMBERS.INVITE` ACTION inside its SERIALIZABLE SQL transaction.
2. `POST /api/tenant/workspace/members/{id}/invitations` body `{}`; no client TenantId, actor, email recipient, token or password. Response `{status:'submitted',expiresAtUtc}` means **accepted by configured SMTP relay**, NOT confirmed inbox delivery. Missing sender 503, denied 403, missing/ineligible target 404, throttling 429. No token ever returned to Owner.
3. Email `https://{tenantSlug}.{workspaceBaseDomain}/auth/activate#token={HEX64}` opens the new public, unguarded `/auth/activate` page. `src/main.ts` calls `captureInitialInvitationFragment()` **before Angular starts** to remove the fragment from browser history before router navigation, and holds a token *only in module memory*. Invalid tokens/hosts fail closed.
4. Public activation page accepts password + confirmation. It derives the tenant slug only from a validated Tenant subdomain. It refuses to send the token to a **cross-origin API**; staging must use a same-origin HTTPS `/api` reverse proxy (the repository Development environment's `https://localhost:7262/api` is NOT a deployable Tenant activation configuration). Endpoint POST `/api/public/tenant-invitations/activate` sends `{tenantSlug,token,password}` only, via `fetch` with `credentials:'omit'`, `mode:'same-origin'`, `redirect:'error'`, `cache:'no-store'` and `referrerPolicy:'no-referrer'`. This guarantees no **same-origin cookies** or OAuth interceptor are involved. A separate interceptor guard rejects accidental cross-origin HttpClient calls. Password cleared after every response, token discarded after success or invalid-link response.
5. On successful response `activated:true`, user can return to ordinary Tenant login. Activation creates **no roles**; the Tenant Owner must assign an ordinary role separately. BFF Tenant cookie pilot remains OFF by default.

## Security and rollout

- No token in `localStorage`, `sessionStorage`, Angular URL or logs; email transport and token hash+SQL state are server-owned. HTML form autocomplete `new-password`; never display token to Owner.
- SMTP/SQL migration/Registry Apply and live grants are not auto-enabled by PR merge. Real isolated Staging DNS, HTTPS, same-origin API proxy, delivery settings, backend config, approved migrations and manual catalog Apply required before actual emails.
- This Angular build is a **UI companion**, not proof of live SMTP delivery. Unit tests cover immediate fragment removal, exact POST body, no-cookie/no-redirect fetch options and capability revalidation; full HTTPS two-user browser activation and later role-revoke acceptance require separately provisioned infrastructure.
- Admin UI visibility is not authorization; API independently validates Owner and tenant scope. Rate limits currently process-local and need gateway/distributed enforcement for multi-node Production.

## Dependencies

- Backend main must include Backend PR #75 migration/route and approved `TENANT.MEMBERS.INVITE` catalog entry.
- Frontend `environment.apiUrl` must resolve to a **same-origin HTTPS** API proxy on tenant host for redeeming tokens. This is intentionally fail-closed; do not weaken to wildcard credentialed CORS.
- Operator must configure SMTP secrets securely and enable `Identity:TenantInvitations:Enabled` only after backend + frontend are deployed together and testing is approved.
