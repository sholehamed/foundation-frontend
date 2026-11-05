# Shinera full-stack Playwright smoke tests

These tests launch both apps and use **real HTTP requests** to the ASP.NET Core API backed by a disposable SQL Server. The E2E-only Angular environment targets `http://127.0.0.1:5069/api`; it does not change production configuration.

## GitHub Actions

The `fullstack-e2e.yml` workflow checks out this frontend and the public backend, starts SQL Server 2022 as a service, installs .NET 10, Node 24 and Playwright Chromium, and runs the smoke suite. The backend migrates and seeds its database at startup. No production database or real administrator credentials are used.

## Local run

Check out the backend into `./backend` within the frontend working directory, or adapt `playwright.config.ts` to the local path. Run an isolated SQL Server on port 1433 and provide:

- `DataBaseServer=127.0.0.1,1433`
- `DataBaseUsername=sa`
- `DataBasePassword=<local test database password>`

Then run `npm install`, `npx playwright install chromium`, `npm run test:e2e`. Playwright starts both servers. Never run these tests against a production or shared database.

## Scope and limitations

The suite now includes **real positive System administrator browser login** with CAPTCHA, authenticated dashboard and tenant paging, browser Role create/edit/read/delete, direct MenuCategory create/update/delete, login-context route guards and OAuth lifecycle checks. The final cross-repository run against backend merged `main` passed **17/17 Playwright tests** ([CI 40100215722](https://github.com/sholehamed/Shinera-frontend/actions/runs/40100215722)), including navigation and real global/scoped Permission, ApiResource, UiResource SQL CRUD with permission associations. Angular Build/Unit passed **15/15** ([CI 40100215742](https://github.com/sholehamed/Shinera-frontend/actions/runs/40100215742)).

Tests run against backend **merged `main`** (not mocks; final tested SHA `38edb93d25e1250a10522513252b11ae988c620d`) with a disposable SQL Server container. Backend [PR #32](https://github.com/sholehamed/Shinera-backend/pull/32) and frontend [PR #4](https://github.com/sholehamed/Shinera-frontend/pull/4) were squash-merged after final cross-repo verification. System User write endpoints are NOT claimed safe or browser-tested and their UI is deliberately disabled until the System-account contract is fixed. Angular form submission and full lifecycle checks across every Resource/Permission screen, Group Membership, and tenant customer workflows still require additional E2E coverage. Deletion of a Permission linked to API/UI Resources requires unlinking first; SQL returns an intentional 409 while links exist. No Production database is used.

CI currently uses `npm install` because this repository has no committed package lockfile. A future change should generate and commit `package-lock.json` then use `npm ci` for reproducible installs.

## Isolation

- Temporary container database, not a production database.
- One Chromium worker in CI; tests are sequential to avoid shared state pollution.
- Traces and screenshots retained on failure.
- Test-only environment/credentials must never be deployed or reused.
