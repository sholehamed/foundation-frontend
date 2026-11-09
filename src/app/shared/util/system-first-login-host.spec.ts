import { canResolveSystemFirstLogin } from './system-first-login-host';
import { looksLikeGeneratedInitialPassword, parseTenantLoginDecision } from './tenant-login-decision';
import { firstLoginRequestOptions } from './tenant-first-login-request';

describe('FR-14B-2B System first-login boundary', () => {
  const base = 'shinera.ir';
  const origin = 'https://shinera.ir';

  it('requires HTTPS, exact root host, System context, opt-in, and same-origin API', () => {
    expect(canResolveSystemFirstLogin(true, 'system', 'shinera.ir',
      'https:', base, '/api', origin)).toBe(true);
    expect(canResolveSystemFirstLogin(false, 'system', 'shinera.ir',
      'https:', base, '/api', origin)).toBe(false);
    expect(canResolveSystemFirstLogin(true, 'tenant', 'shinera.ir',
      'https:', base, '/api', origin)).toBe(false);
    expect(canResolveSystemFirstLogin(true, 'system', 'owner.shinera.ir',
      'https:', base, '/api', origin)).toBe(false);
    expect(canResolveSystemFirstLogin(true, 'system', 'identity.shinera.ir',
      'https:', base, '/api', origin)).toBe(false);
    expect(canResolveSystemFirstLogin(true, 'system', 'shinera.ir',
      'http:', base, '/api', origin)).toBe(false);
    expect(canResolveSystemFirstLogin(true, 'system', 'shinera.ir',
      'https:', base, 'https://evil.test/api', origin)).toBe(false);
  });

  it('accepts a short-lived change-only result, never an authenticated result', () => {
    const valid = parseTenantLoginDecision({
      status: 'password_change_required',
      challenge: 'A'.repeat(64),
      expiresAtUtc: '2026-11-09T18:05:00Z',
    });
    expect(valid?.status).toBe('password_change_required');
    expect(parseTenantLoginDecision({ status: 'authenticated' })).toBeNull();
    expect(looksLikeGeneratedInitialPassword('ABCDEF-GHJKLM-NPQRST-UVWXYZ'))
      .toBe(true);
    expect(looksLikeGeneratedInitialPassword('normal-password')).toBe(false);
  });

  it('never sends cookies, redirects, referrers or tokens in the proof exchange', () => {
    const options = firstLoginRequestOptions({
      userName: 'pending.system', temporaryPassword: 'secret',
    }, new AbortController().signal);
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('omit');
    expect(options.redirect).toBe('error');
    expect(options.referrerPolicy).toBe('no-referrer');
    expect(options.mode).toBe('same-origin');
    expect(JSON.stringify(options.body)).not.toContain('access_token');
  });
});
