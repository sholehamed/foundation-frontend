/**
 * FR-13B-3B. A normal password is never intercepted by initial-login
 * detection, preserving the original Identity login path and its CAPTCHA.
 * Only the unshared, server-generated 4x6 credential format is resolved.
 */
export function looksLikeGeneratedInitialPassword(password: string): boolean {
  return /^[A-Za-z0-9]{6}(?:-[A-Za-z0-9]{6}){3}$/.test(password);
}

export type TenantLoginDecision =
  | { status: 'continue_login' }
  | { status: 'password_change_required'; challenge: string; expiresAtUtc: string };

export function parseTenantLoginDecision(value: unknown): TenantLoginDecision | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate['status'] === 'continue_login' &&
      (candidate['challenge'] == null))
    return { status: 'continue_login' };
  if (candidate['status'] === 'password_change_required' &&
      typeof candidate['challenge'] === 'string' &&
      /^[A-F0-9]{64}$/.test(candidate['challenge']) &&
      typeof candidate['expiresAtUtc'] === 'string' &&
      Number.isFinite(Date.parse(candidate['expiresAtUtc'])))
    return {
      status: 'password_change_required',
      challenge: candidate['challenge'],
      expiresAtUtc: candidate['expiresAtUtc'],
    };
  return null;
}
