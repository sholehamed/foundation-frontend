/**
 * FR-13B-3: a restricted first-login exchange is not an app session.
 * Explicit fetch omit prevents even same-origin cookies and bypasses the
 * app's OAuth/BFF interceptors. The credential/challenge are never stored,
 * logged, put in a URL or exposed to another origin.
 */
export function firstLoginRequestOptions(
  body: Record<string, string>, signal: AbortSignal,
): RequestInit {
  return {
    method: 'POST',
    mode: 'same-origin',
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  };
}
