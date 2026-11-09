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
  // System proof also remains off in the isolated Tenant BFF browser pilot.
  systemFirstLoginEnabled: false,
  // FR-14B-3: reviewed System account editor, OFF until catalog + SQL rollout.
  systemAccountLifecycleUiEnabled: false,
  // FR-14C-1: audited dynamic Tenant menu tree; separate rollout, OFF.
  tenantDynamicNavigationPilotEnabled: false,
  // FR-14C-2B: Tenant Owner-only menu editor. OFF until approved SQL+Catalog rollout.
  tenantNavigationEditorPilotEnabled: false,
  workspaceBaseDomain: 'shinera.localhost',
};
