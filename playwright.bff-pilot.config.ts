import { defineConfig, devices } from '@playwright/test';

/**
 * FR-12G-B: independently test Angular's BFF UI wiring in actual Chromium,
 * with deterministic HTTP fixtures. This does NOT substitute real OIDC,
 * backend SQL, TLS/HttpOnly cookie or Identity browser E2E acceptance.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/tenant-bff-pilot.spec.ts',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://tenant-a.shinera.localhost:4200',
    launchOptions: {
      args: ['--host-resolver-rules=MAP tenant-a.shinera.localhost 127.0.0.1'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run start -- --configuration bff-pilot-e2e --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
