# FR-17B-2B — System Admin Plan Catalog in Angular

**Date:** 2026-11-10. **Backend:** [PR #131](https://github.com/sholehamed/foundation-backend/pull/131). **Frontend:** [PR #61](https://github.com/sholehamed/foundation-frontend/pull/61). **Feature:** `/system/plan-catalog`.

## Why the screen belongs to System Admin

The software owner defines centrally all Modules, EndpointGroup/Controller Resources, Permissions, Plan versions and pricing. A Tenant Owner **cannot** create Plans or purchase a `RolePermission`; after a real purchase, the Tenant gains eligibility to a Module and still independently assigns user permissions.

`system.plan-catalog` is now the 14th root in the code-owned System feature registry and Angular `systemFeatureRouteSegments`. The lazy Angular component is beneath existing System session and every-child access guard. The backend owns its `PLAN-CATALOG.READ/CREATE/UPDATE/PUBLISH` permissions and the actual Menu permission. No frontend developer-written Permission.Code list is used to bypass central Registry.

## Frontend files

- `src/app/features/system/plan-catalog/system-plan-catalog.service.ts`: typed read/write of central System endpoint group.
- `system-plan-catalog.component.ts/html/scss`: RTL Persian editor with public-class card design conventions, responsive layout and explicit empty/error states.
- Companion `.spec.ts`: server URL/HTTP contract, empty catalog state, draft review and disabled Publish with no vetted commercial modules.

## Administrator workflow

1. Open `/system/plan-catalog`. Request the System Plan list and **code-owned commercial module options**.
2. Enter short stable PlanCode (max 20 due existing signup intent storage), name, card title/subtitle and optionally select the **latest published parent PlanVersion**. Create a Draft.
3. Open the persisted Draft, select only vetted commercial Modules, add price offers for monthly/yearly in **IRR (ریال)**, modify badges/description and add display Module/Benefit rows. These display rows are marketing data and **never create permissions**.
4. Save the Draft through its own guarded `PUT`. The UI invalidates any previous review on changes.
5. Select **پیش‌نمایش و اعتبارسنجی انتشار**. The backend reports effective inherited Module codes, a content fingerprint and blocking issues.
6. Only a successful current backend preview enables **انتشار نسخه تأییدشده**. The publish endpoint revalidates source, SQL and fingerprint; a concurrent change rejects the operation. A published version is immutable through this editor.
7. After publication, an operator can start a **new Draft revision**; prior sold-version content is never overwritten. The public landing PlanCards are separately generated from published snapshots, not Angular plan definitions.

## Deliberate fail-closed behavior

- At present the source manifest has **zero Commercial Modules**. The editor displays “هنوز هیچ ماژول تجاری تاییدشده‌ای ثبت نشده؛ انتشار پلن ممکن نیست.” Creating a Draft works; publishing any sellable Plan **does not**. It cannot show a fake purchasable Plan card.
- Existing DB installations may lack `PLAN-CATALOG.*` permission and Menu until operator previews and applies the reviewed System Feature Registry and assigns role grants through audited Master workflow. Fresh install seeds all first-party System root rights for Master SuperAdmin; never re-grant previously revoked roles automatically.
- The UI does **not** create TenantSubscription/RolePermission/Order, redeem promo codes, charge users or enable any plan. All such states require future Billing/Entitlement implementation and verified server checkout.

## Release/checklist

- Backend PR must land before Angular deploy. Both current-head CI suites and post-merge `main` actions need checking separately.
- Angular app Unit and development Build plus existing Chromium BFF tests.
- SQL Server disposable tests for Plan publication/read, permission seeding and no-tenant-grant effects; User/Tenant login and navigation tests remain unchanged.
- Staging has not been proven unless the real staging workflows are run successfully; no inference from GitHub CI alone.

**Future:** real Commercial Modules, typed capability/limit editor and usage contract, immutability at SQL privilege/trigger layer, safe existing-catalog RBAC rollout, subscriptions, discounts with expiry/max uses, zero-total settlement and payment gateways. See [backend detailed handoff](https://github.com/sholehamed/foundation-backend/blob/main/docs/development/FR-17B2B-SYSTEM-PLAN-CATALOG-ADMIN.md).
