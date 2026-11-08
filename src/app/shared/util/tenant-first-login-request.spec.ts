import { firstLoginRequestOptions } from './tenant-first-login-request';

describe('FR-13B-3 first-login challenge transport', () => {
  it('cannot send app session cookies or follow redirects', () => {
    const controller = new AbortController();
    const initial = firstLoginRequestOptions({
      tenantSlug: 'demo', userName: 'employee',
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    }, controller.signal);
    expect(initial.method).toBe('POST');
    expect(initial.mode).toBe('same-origin');
    expect(initial.credentials).toBe('omit');
    expect(initial.redirect).toBe('error');
    expect(initial.cache).toBe('no-store');
    expect(initial.referrerPolicy).toBe('no-referrer');
    expect(initial.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(initial.signal).toBe(controller.signal);
    expect(initial).not.toHaveProperty('withCredentials');
    expect(initial).not.toHaveProperty('Authorization');
    expect(JSON.parse(initial.body as string)).toEqual({
      tenantSlug: 'demo', userName: 'employee',
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    });
  });

  it('complete requires only tenant, single-purpose challenge and new password', () => {
    const controller = new AbortController();
    const challenge = 'A'.repeat(64);
    const result = firstLoginRequestOptions({
      tenantSlug: 'demo', challenge, newPassword: 'My-Long-Unique-Passphrase-2026',
    }, controller.signal);
    expect(JSON.parse(result.body as string)).toEqual({
      tenantSlug: 'demo', challenge,
      newPassword: 'My-Long-Unique-Passphrase-2026',
    });
    expect(result.credentials).toBe('omit');
    expect(result.redirect).toBe('error');
  });
});
