import {
  looksLikeGeneratedInitialPassword, parseTenantLoginDecision,
} from './tenant-login-decision';

describe('FR-13B-3B ordinary Tenant login decision', () => {
  it('sends ordinary passwords into existing login without consuming temporary challenge attempts', () => {
    expect(looksLikeGeneratedInitialPassword('My-Strong-Normal-Passphrase-2026!')).toBe(false);
    expect(looksLikeGeneratedInitialPassword('not-a-temp')).toBe(false);
    expect(looksLikeGeneratedInitialPassword('ABCDEF-ghijkl-MNOPQR-stuvwx')).toBe(true);
  });

  it('permits only a verified change-only server response with exact challenge and expiry', () => {
    const expiry = '2026-11-09T18:00:00Z';
    const challenge = 'A'.repeat(64);
    expect(parseTenantLoginDecision({
      status: 'password_change_required', challenge, expiresAtUtc: expiry,
    })).toEqual({ status: 'password_change_required', challenge, expiresAtUtc: expiry });
    expect(parseTenantLoginDecision({ status: 'continue_login' }))
      .toEqual({ status: 'continue_login' });
    expect(parseTenantLoginDecision({ status: 'continue_login', challenge })).toBeNull();
    expect(parseTenantLoginDecision({ status: 'password_change_required', challenge: 'x' }))
      .toBeNull();
    expect(parseTenantLoginDecision({
      status: 'password_change_required', challenge, expiresAtUtc: 'invalid',
    })).toBeNull();
    expect(parseTenantLoginDecision({ status: 'authenticated', challenge })).toBeNull();
    expect(parseTenantLoginDecision(null)).toBeNull();
  });
});
