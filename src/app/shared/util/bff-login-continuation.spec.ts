import { validateBffAuthorizationReturnUrl } from './bff-login-continuation';

describe('validateBffAuthorizationReturnUrl', () => {
  const clientId = 'foundation-browser-bff';

  function request(context: 'system' | 'tenant', tenant?: string): string {
    const query = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: 'https://tenant-a.shinera.localhost/signin-oidc',
      scope: 'openid profile email api offline_access roles permissions',
      state: '0123456789abcdef0123456789abcdef',
      nonce: 'abcdef0123456789abcdef0123456789',
      code_challenge: 'A'.repeat(43),
      code_challenge_method: 'S256',
      login_context: context,
    });
    if (tenant) query.set('tenant', tenant);
    return '/api/connect/authorize?' + query.toString();
  }

  it('accepts a valid system authorization continuation', () => {
    const value = request('system');
    expect(validateBffAuthorizationReturnUrl(value, 'system', null, clientId)).toBe(value);
  });

  it('accepts a valid tenant authorization continuation only for its tenant', () => {
    const value = request('tenant', 'tenant-a');
    expect(validateBffAuthorizationReturnUrl(value, 'tenant', 'tenant-a', clientId)).toBe(value);
    expect(validateBffAuthorizationReturnUrl(value, 'tenant', 'tenant-b', clientId)).toBeNull();
  });

  it('rejects external and protocol-relative navigation', () => {
    expect(validateBffAuthorizationReturnUrl('https://evil.example', 'system', null, clientId)).toBeNull();
    expect(validateBffAuthorizationReturnUrl('//evil.example/api/connect/authorize', 'system', null, clientId)).toBeNull();
  });

  it('rejects the wrong client, response type or PKCE method', () => {
    const wrongClient = request('system').replace(clientId, 'postman');
    const implicit = request('system').replace('response_type=code', 'response_type=token');
    const plain = request('system').replace('code_challenge_method=S256', 'code_challenge_method=plain');
    expect(validateBffAuthorizationReturnUrl(wrongClient, 'system', null, clientId)).toBeNull();
    expect(validateBffAuthorizationReturnUrl(implicit, 'system', null, clientId)).toBeNull();
    expect(validateBffAuthorizationReturnUrl(plain, 'system', null, clientId)).toBeNull();
  });

  it('rejects a non-HTTPS or non-OIDC callback URI', () => {
    const http = request('system').replace('https%3A%2F%2Ftenant-a', 'http%3A%2F%2Ftenant-a');
    const wrongPath = request('system').replace('signin-oidc', 'callback');
    expect(validateBffAuthorizationReturnUrl(http, 'system', null, clientId)).toBeNull();
    expect(validateBffAuthorizationReturnUrl(wrongPath, 'system', null, clientId)).toBeNull();
  });

  it('rejects duplicate security parameters and a mismatched login context', () => {
    const duplicate = request('system') + '&state=attacker-controlled-state';
    const tenant = request('tenant', 'tenant-a');
    expect(validateBffAuthorizationReturnUrl(duplicate, 'system', null, clientId)).toBeNull();
    expect(validateBffAuthorizationReturnUrl(tenant, 'system', null, clientId)).toBeNull();
  });
});
