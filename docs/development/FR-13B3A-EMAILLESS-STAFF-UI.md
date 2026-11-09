# FR-13B-3A — Staff creation without an email (Angular)

Date: 2026-11-09. Backend [Issue #78](https://github.com/sholehamed/foundation-backend/issues/78), parent [#70](https://github.com/sholehamed/foundation-backend/issues/70).

## User flow

- The existing Tenant Owner `/dashboard/members` creation form makes **email optional** and labels it as useful only for email invitations. Leaving it empty sends JSON `email: null`, not a fake account or mailbox. The server, not the form, still validates and enforces its unique normalized-email index for actual email values. The existing username and first/last name are mandatory.
- When the reviewed, opt-in temporary-password feature and live Owner capability are available, an Owner can create an email-less inactive member and issue a **one-time 60-minute initial password atomically**, with exactly the same security restrictions and secret-clearing behavior as an employee with email. The employee changes their password on the **normal Login**, then must log in again. The UI never manufactures an email address.
- If email was omitted and no initial secret issued, the member remains inactive without access until an Owner issues an initial password separately. No silent role assignment.
- Directory displays **بدون ایمیل · فعال‌سازی حضوری** rather than the literal `null`. The **Send email invitation** button is absent on email-less rows and `inviteMember` rechecks that an actual nonempty address exists even if invoked without a button. The Backend independently fails closed.
- Email invitation remains available for inactive staff with a genuine email and live permission. The invite still has a separate sender requirement; no assumption about inbox delivery.
- Public Owner registration, system user creation and other email-mandatory flows have not changed their validation contracts. No new profile-email update flow or password-recovery channel is introduced.

## Validation and release boundary

- Angular unit cases cover optional native form validity and null POST, atomic no-email + temp password handoff and secret clearing, absence of invite for null email, and preservation of invite action for real email.
- SQL migration is in the Backend PR: `20261109040000_tenantstaffoptionalemail`; it makes two User columns nullable and filters unique Tenant email indexes for non-NULL email values. Database Down intentionally refuses rollback while email-less Users exist. Review, back up and test staging DB migration before rollout.
- `tenantFirstLoginEnabled`, BFF browser pilot and SMTP invitation delivery remain **OFF** by default. Code merge is not a deployment and does not grant Owner rights, apply the Registry, migrate a real database or establish a real mail sender.
- Real HTTPS two-host BFF login with email-less user, permission assignment and revoke remains a separate Staging acceptance step; code/CI only do not certify it.
