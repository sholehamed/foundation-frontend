# FR-17B-2C — Published Plan snapshots are visibly locked

**Date:** 2026-11-11  
**Frontend PR:** [#62](https://github.com/sholehamed/foundation-frontend/pull/62)  
**Backend companion:** [#132](https://github.com/sholehamed/foundation-backend/pull/132)  

## User experience

The central System Admin `/system/plan-catalog` route already distinguishes editable Drafts from Published Plan revisions. The new SQL Server DML immutability migration prevents subsequent editing of a Published PlanVersion and its Module, Capability, PriceOffer, and marketing DisplayItem rows, including ad-hoc SQL updates. The Admin interface now makes this lifecycle explicit.

- When `PlanCatalogRow.latestPublishedVersionId` is populated, the Plan list displays a lock icon and the message **«نسخه منتشرشده قفل است؛ تغییرات فقط با نسخه جدید اعمال می‌شوند.»**
- For a Published-only Plan (no active Draft), the **only editing path** is **نسخه جدید** to create a new Draft revision through the existing API. No ‘edit published’ button exists.
- A Plan with both historical Published version and a new Draft still displays the lock message for the **historical** Published version while allowing edit of the **current Draft**.
- The header explains that published features and prices are fixed. It does **not** claim plan purchase, Tenant subscription or a coupon settlement was completed.
- Angular spec `system-plan-catalog.component.spec.ts` verifies a sample published row shows a lock message and new-version action but no `ویرایش پیش‌نویس` action when a Draft does not exist.

## No new authorization bypass

The frontend does not take a PlanVersion status parameter supplied by the browser. It renders the state from the centrally authorized System PlanCatalog list API. The backend only accepts Draft edits and publication requires an independently verified SHA-256 fingerprint. SQL triggers are server-side enforcement, and UI notice is not treated as a security boundary.

## Release considerations

- Deploy the backend migration and EF trigger metadata in the same release to avoid SQL Server OUTPUT-clause incompatibility.
- Keep the existing feature registry and Master rights reconciliation requirements for existing DB installations.
- Both PR-head and post-merge `main` CI need to be green. CI is **not staging**.
- **Do not** edit Published records, their offers or `CatalogPlans.IsActive` from raw SQL to deactivate a sale. Future separate audited availability overlay required for legitimate suspension/retirement.
- No Commercial Module is currently registered from application code, so creating a Plan Draft works but Publish remains blocked and public cards may remain empty. Subscription/Entitlement, discounts and payments are still future work.

Reference the backend SQL migration notes: [FR-17B-2C](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-17B2C-IMMUTABLE-PLAN-SNAPSHOTS.md).
