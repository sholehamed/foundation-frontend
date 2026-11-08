// Playwright + GitHub Actions only: the API is the real ASP.NET Core app.
// Never point E2E tests at a shared development or production database.
export const environment = {
  apiUrl: 'http://127.0.0.1:5069/api',
  SubPath: '',
  AppName: 'شاینرا',
  scope: 'openid profile email api offline_access',
  client_id: 'postman',
  bffClientId: 'foundation-browser-bff',
  grant_type: 'password',
  // Reviewed granular UI pilot. Defaults OFF until Registry Apply and grants are ready.
  systemUiAccessPilotEnabled: false,
  // FR-12G: experimental Tenant browser BFF API mode. OFF for every shipped build.
  bffTenantPilotEnabled: false,
  workspaceBaseDomain: 'shinera.localhost',
};
