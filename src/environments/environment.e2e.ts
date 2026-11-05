// Playwright + GitHub Actions only: the API is the real ASP.NET Core app.
// Never point E2E tests at a shared development or production database.
export const environment = {
  apiUrl: 'http://127.0.0.1:5069/api',
  SubPath: '',
  AppName: 'شاینرا',
  scope: 'openid profile email api offline_access',
  client_id: 'postman',
  grant_type: 'password',
  workspaceBaseDomain: 'shinera.localhost',
};
