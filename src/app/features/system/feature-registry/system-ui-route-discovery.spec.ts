import { discoverExecutableSystemChildRoutes } from './system-ui-route-discovery';

describe('System actual executable nested route inventory', () => {
  it('collects every nested page from live Angular lazy route config without a production duplicate map', async () => {
    const routes = await discoverExecutableSystemChildRoutes();
    expect(routes).toEqual([
      '/system/admins/:userId/edit',
      '/system/admins/create',
      '/system/api-resources/:apiResourceId/edit',
      '/system/api-resources/create',
      '/system/groups/:groupId/edit',
      '/system/groups/:groupId/members',
      '/system/groups/create',
      '/system/modules/:moduleId/edit',
      '/system/modules/create',
      '/system/permissions/:permissionId/edit',
      '/system/permissions/create',
      '/system/resources/:resourceId/apiResources',
      '/system/resources/:resourceId/apiResources/:apiResourceId/edit',
      '/system/resources/:resourceId/apiResources/create',
      '/system/resources/:resourceId/edit',
      '/system/resources/:resourceId/permissions',
      '/system/resources/:resourceId/permissions/:permissionId/edit',
      '/system/resources/:resourceId/permissions/create',
      '/system/resources/:resourceId/uiResources',
      '/system/resources/:resourceId/uiResources/:uiResourceId/edit',
      '/system/resources/:resourceId/uiResources/create',
      '/system/resources/create',
      '/system/roles/:roleId/edit',
      '/system/roles/:roleId/permissions',
      '/system/roles/create',
      '/system/tenants/:tenantId/edit',
      '/system/tenants/:tenantId/overview',
      '/system/tenants/create',
      '/system/ui-resources/:uiResourceId/edit',
      '/system/ui-resources/create',
      '/system/users/:userId/edit',
      '/system/users/create',
    ]);
    expect(routes.length).toBe(32);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).not.toContain('/system/tenants/:tenantId');
    expect(routes.every(x => !x.includes('**'))).toBe(true);
  });
});
