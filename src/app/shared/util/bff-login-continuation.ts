export type BffLoginContext = 'system' | 'tenant';

/**
 * Validates the only non-application return path the existing Identity login
 * page may continue: the same-origin OpenIddict authorization endpoint for
 * the configured first-party BFF client.
 *
 * The backend still performs authoritative client, redirect URI, PKCE and
 * account-context validation. This is a UI navigation allowlist, not OAuth
 * protocol validation.
 */
export function validateBffAuthorizationReturnUrl(
  candidate: string | null | undefined,
  loginContext: string,
  tenant: string | null | undefined,
  clientId: string,
): string | null {
  if (
    !candidate ||
    candidate.length > 4096 ||
    !candidate.startsWith('/api/connect/authorize?') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.includes('#') ||
    /[\u0000-\u001f\u007f]/.test(candidate) ||
    loginContext !== 'system' && loginContext !== 'tenant'
  ) {
    return null;
  }

  try {
    const url = new URL(candidate, 'https://identity.local');
    if (
      url.origin !== 'https://identity.local' ||
      url.pathname !== '/api/connect/authorize' ||
      url.hash
    ) {
      return null;
    }

    const unique = (key: string): string | null => {
      const values = url.searchParams.getAll(key);
      return values.length === 1 && values[0].trim().length > 0
        ? values[0]
        : null;
    };

    if (
      unique('client_id') !== clientId ||
      unique('response_type') !== 'code' ||
      unique('code_challenge_method') !== 'S256' ||
      !/^[A-Za-z0-9_-]{43}$/.test(unique('code_challenge') ?? '') ||
      (unique('state')?.length ?? 0) < 16 ||
      (unique('nonce')?.length ?? 0) < 16 ||
      !unique('scope')?.split(/\s+/).includes('openid') ||
      unique('login_context') !== loginContext
    ) {
      return null;
    }

    const redirectValue = unique('redirect_uri');
    if (!redirectValue) return null;

    const callback = new URL(redirectValue);
    if (
      callback.protocol !== 'https:' ||
      callback.username ||
      callback.password ||
      callback.pathname !== '/signin-oidc' ||
      callback.search ||
      callback.hash
    ) {
      return null;
    }

    const requestedTenant = unique('tenant');
    if (loginContext === 'system') {
      if (requestedTenant !== null) return null;
    } else {
      const expectedTenant = tenant?.trim().toLowerCase();
      if (
        !expectedTenant ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expectedTenant) ||
        requestedTenant?.toLowerCase() !== expectedTenant
      ) {
        return null;
      }
    }

    return candidate;
  } catch {
    return null;
  }
}
