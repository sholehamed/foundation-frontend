import { bffSessionMatchesTenantHost } from './tenant-session.guard';
import type { BffSessionResponse } from '../models/bff-session.contract';

const tenant: BffSessionResponse = {
  authenticated: true,
  user: { id: 'valid-user', username: 'owner', displayName: 'Owner' },
  context: { type: 'tenant', tenantId: 'tenant-id', tenantSlug: 'tenant-a' },
};

describe('Tenant BFF host guard', () => {
  it('accepts matching Tenant host and refuses wrong tenant, System and identity hosts', () => {
    expect(bffSessionMatchesTenantHost(tenant,
      'tenant-a.shinera.localhost', 'shinera.localhost')).toBe(true);
    expect(bffSessionMatchesTenantHost(tenant,
      'tenant-b.shinera.localhost', 'shinera.localhost')).toBe(false);
    expect(bffSessionMatchesTenantHost(tenant,
      'identity.shinera.localhost', 'shinera.localhost')).toBe(false);
    expect(bffSessionMatchesTenantHost(tenant,
      'shinera.localhost', 'shinera.localhost')).toBe(false);
    expect(bffSessionMatchesTenantHost({
      authenticated: true, user: tenant.user,
      context: { type: 'system', tenantId: null, tenantSlug: null },
    }, 'tenant-a.shinera.localhost', 'shinera.localhost')).toBe(false);
  });
});
