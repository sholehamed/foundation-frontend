/**
 * The activation secret is a one-time bearer factor sent only in the JSON
 * request body. Explicit fetch omit prevents even SAME-ORIGIN cookies,
 * unlike XMLHttpRequest withCredentials:false.
 */
export function activationRequestOptions(
  tenantSlug: string, token: string, password: string, signal: AbortSignal,
): RequestInit {
  return {
    method: 'POST',
    mode: 'same-origin',
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantSlug, token, password }),
    signal,
  };
}
