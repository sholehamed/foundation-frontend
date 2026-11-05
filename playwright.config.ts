import { defineConfig, devices } from '@playwright/test';

const frontendUrl = 'http://127.0.0.1:4200';
const backendUrl = 'http://127.0.0.1:5069';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'dotnet run --project src/Web/Web.csproj --no-launch-profile --urls http://127.0.0.1:5069',
      cwd: './backend',
      url: backendUrl + '/api/system/Auth/captcha/new',
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      name: 'Shinera API',
    },
    {
      command: 'npm run start -- --configuration e2e --host 127.0.0.1 --port 4200',
      url: frontendUrl,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      name: 'Shinera Angular',
    },
  ],
});
