import { routes } from '../../app.routes';
import { tenantSessionGuard } from '../../shared/guards/tenant-session.guard';

describe('Tenant Admin read-only child navigation', () => {
  it('preserves /dashboard after login and protects every child with tenant session guard', () => {
    const route = routes.find(x => x.path === 'dashboard');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(tenantSessionGuard);
    expect(route?.canActivateChild).toContain(tenantSessionGuard);

    const pages = route?.children ?? [];
    expect(pages.map(x => x.path)).toEqual(['', 'business', 'branches']);
    expect(pages.every(x => !!x.loadComponent)).toBe(true);
    expect(routes.find(x => x.path === 'system')).toBeDefined();
    expect(routes.some(x => x.path === 'auth')).toBe(true);
  });
});
