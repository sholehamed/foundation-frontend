import { activationRequestOptions } from './tenant-invitation-activation-request';

describe('FR-13B-2 anonymous activation request security', () => {
  it('omits same-origin cookies, OAuth, referrer and redirect handling', () => {
    const controller = new AbortController();
    const token = 'A'.repeat(64);
    const options = activationRequestOptions(
      'demo', token, 'P@ssword-For-St4ff!', controller.signal,
    );
    expect(options.method).toBe('POST');
    expect(options.mode).toBe('same-origin');
    expect(options.credentials).toBe('omit');
    expect(options.redirect).toBe('error');
    expect(options.referrerPolicy).toBe('no-referrer');
    expect(options.cache).toBe('no-store');
    expect(options.signal).toBe(controller.signal);
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body as string)).toEqual({
      tenantSlug: 'demo', token, password: 'P@ssword-For-St4ff!',
    });
    expect(options).not.toHaveProperty('Authorization');
    expect(options).not.toHaveProperty('withCredentials');
  });
});
