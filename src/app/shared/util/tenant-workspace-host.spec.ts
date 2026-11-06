import { isTenantWorkspaceHost } from './tenant-workspace-host';

describe('Identity UI vs tenant application host boundary', () => {
  const base = 'shinera.localhost';

  it('resolves only valid single-label tenant workspace hosts', () => {
    expect(isTenantWorkspaceHost('tenant-a.shinera.localhost', base)).toBe(true);
    expect(isTenantWorkspaceHost('SALON1.SHINERA.LOCALHOST', base)).toBe(true);
    expect(isTenantWorkspaceHost('shop.shinera.localhost.', base)).toBe(true);
  });

  it.each(['identity', 'auth', 'api', 'system', 'admin', 'www', 'cdn', 'public'])(
    'never initializes tenant context on reserved %s host', (slug) => {
      expect(isTenantWorkspaceHost(slug + '.' + base, base)).toBe(false);
    },
  );

  it('rejects root, unrelated, nested and malformed hosts', () => {
    for (const host of [
      'shinera.localhost', 'identity.example.org', 'x.y.shinera.localhost',
      '-bad.shinera.localhost', 'bad-.shinera.localhost',
      'tenant-a.shinera.localhost:4200', '//tenant-a.shinera.localhost',
      'notshinera.localhost',
    ]) {
      expect(isTenantWorkspaceHost(host, base)).toBe(false);
    }
  });
});
