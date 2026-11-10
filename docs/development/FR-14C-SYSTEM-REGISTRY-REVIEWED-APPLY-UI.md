# FR-14C — System Admin reviewed Feature Registry Apply UI

Checkpoint 2026-11-10. Companion to Backend [System Registry fingerprinted SQL Apply](https://github.com/sholehamed/foundation-backend/pull/113).

- System Admin Preview includes a server-generated 64-hex `fingerprint` alongside the exact pending/conflicting catalog records.
- The existing page continues to compare the authoritative Backend Manifest with all executable Angular System routes and nested Pages; the separate central Tenant Catalog/Menu/Endpoint diagnostics remain independent.
- The Apply button cannot run unless the latest System Preview is conflict-free, pending, Manifest verification succeeded and the 64-hex fingerprint is present. Human confirmation is mandatory; the request sends **only `{ fingerprint }`** to the System endpoint, no Tenant, Role, Permission or user identifiers.
- When the separately enabled live UI ACTION check is active, it is revalidated before submit. The Backend independently requires a live persisted System SuperAdmin, default-OFF Apply gate and SERIALIZABLE SQL fingerprint recheck.
- On 409/403 the component clears its stale System Preview and requires a new read. On success it reloads Preview and independent central diagnostics; the original returned pre-Apply snapshot is never a substitute for post-Apply validation.
- Existing Tenant Permission Catalog Apply remains independently fingerprinted and operator-controlled, and no Tenant can author menus. This change does **not** enable Apply in any environment, configure Staging/Production, repair historical data or turn on dynamic navigation.

Unit request-contract and component tests assert the exact fingerprint payload, absence of automatic mutations, invalid/missing tokens, human cancellation, Manifest mismatch, 403/409 stale-state cleanup and post-success refresh.

Backend and frontend must deploy as a matching pair if any separately approved operator window uses System Feature Registry Apply; old `POST {}` clients intentionally receive a binding/validation error. The default-OFF deployment flag is unchanged.
