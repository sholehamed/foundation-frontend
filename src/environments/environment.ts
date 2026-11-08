export const environment = {
  apiUrl: 'https://localhost:7262/api',
  SubPath: '/UWMS',
  AppName: 'سامانه مدیریت کاربران',
  scope: 'openid profile email api offline_access',
  client_id: 'postman',
  bffClientId: 'foundation-browser-bff',
  grant_type: 'password',
  // Reviewed granular UI pilot. Defaults OFF until Registry Apply and grants are ready.
  systemUiAccessPilotEnabled: false,
  // FR-12G: experimental Tenant browser BFF API mode. OFF for every shipped build.
  bffTenantPilotEnabled: false,
  workspaceBaseDomain: 'shinera.localhost',
}
