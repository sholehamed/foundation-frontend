# Foundation Frontend

A reusable **Angular 22** standalone application foundation, developed in small, tested milestones. The backend is a separate private repository: [foundation-backend](https://github.com/sholehamed/foundation-backend).

**F00 scope:** basic lazy routes, responsive shell, TypeScript strictness, API connectivity diagnostic and CI. Authentication, roles, tenant context and shared business components are **not implemented yet**.

## Requirements
- Node.js 24 recommended (22.12+ also supported by the Angular 22 toolchain)
- npm
- Optional: backend running at `http://localhost:5080`

## Local development

```bash
npm install
npm start
```

Open `http://localhost:4200`. Angular's dev proxy forwards `/api` to `http://localhost:5080`; the UI still loads without a running backend.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The initial scaffold intentionally does not include a generated `package-lock.json` because it has not been produced by a successful install. **Generate and commit it before accepting the bootstrap PR**, then change CI to `npm ci` for fully reproducible dependency installation.

## Project direction

- Standalone components + lazy feature routes.
- Signals for local view state; RxJS for HTTP requests.
- Strict TypeScript; responsive UI; no fake login.
- Server-side security is authoritative. Frontend guards will be UX only.
- RTL/LTR, Material, theming, permissions and auth join in later tested milestones.

Track work in [F00 issue #1](https://github.com/sholehamed/foundation-frontend/issues/1) and [roadmap](docs/ROADMAP.md).
