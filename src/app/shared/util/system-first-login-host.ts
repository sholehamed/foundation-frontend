/** FR-14B-2B: System login proof is only legal on the exact root host.
 * Never send a temporary credential to a tenant subdomain, Identity origin,
 * HTTP endpoint or cross-origin API. The backend enforces the same rule.
 */
export function canResolveSystemFirstLogin(
  enabled: boolean, loginContext: string, hostname: string,
  protocol: string, workspaceBaseDomain: string,
  apiUrl: string, browserOrigin: string,
): boolean {
  if (!enabled || loginContext !== 'system' || protocol !== 'https:') return false;
  const expected = workspaceBaseDomain.trim().replace(/\.$/, '').toLowerCase();
  const actual = hostname.trim().replace(/\.$/, '').toLowerCase();
  if (!expected || actual !== expected) return false;
  try {
    return new URL(apiUrl, browserOrigin).origin === browserOrigin;
  } catch {
    return false;
  }
}
