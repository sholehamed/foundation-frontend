export const environment = {
  // Same-origin reverse proxy: configure /api -> Shinera .NET API on IIS.
  apiUrl: '/api',
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
  // FR-13B-3: restricted initial-login pilot remains OFF in this build.
  tenantFirstLoginEnabled: false,
  workspaceBaseDomain: 'shinera.ir',
};
