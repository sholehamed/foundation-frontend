// Only built by the isolated mocked Chromium pilot job. Never ship/deploy.
export const environment = {
  apiUrl: '/api',
  SubPath: '',
  AppName: 'Foundation Tenant Browser Pilot',
  scope: 'openid profile email api offline_access',
  client_id: 'postman',
  bffClientId: 'foundation-browser-bff',
  grant_type: 'password',
  systemUiAccessPilotEnabled: false,
  bffTenantPilotEnabled: true,
  // FR-13B-3: restricted initial-login pilot remains OFF in this build.
  tenantFirstLoginEnabled: false,
  workspaceBaseDomain: 'shinera.localhost',
};
