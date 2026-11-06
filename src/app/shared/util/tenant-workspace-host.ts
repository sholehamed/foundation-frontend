/**
 * Conservative host classification for Angular startup only.
 * Security-sensitive tenant resolution and authorization remain on the server.
 * Identity UI hosts must never run TenantContextService.initialize().
 */
const RESERVED_INFRASTRUCTURE_SLUGS = new Set([
  'identity', 'auth', 'api', 'admin', 'system', 'www', 'cdn',
  'mail', 'help', 'blog', 'public', 'support',
]);

export function isTenantWorkspaceHost(hostname: string, workspaceBaseDomain: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  const base = workspaceBaseDomain.trim().toLowerCase().replace(/\.$/, '');
  if (!host || !base || host.includes(':') || base.includes(':')) return false;

  const suffix = '.' + base;
  if (!host.endsWith(suffix)) return false;

  const slug = host.slice(0, -suffix.length);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 63 && !RESERVED_INFRASTRUCTURE_SLUGS.has(slug);
}
