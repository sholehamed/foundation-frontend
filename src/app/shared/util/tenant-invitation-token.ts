/**
 * FR-13B-2: invitation tokens must NEVER be left in browser URLs/history,
 * Angular Router URLs, localStorage/sessionStorage or application logs.
 * The email URL uses a fragment so the initial GET never sends the secret
 * to the reverse proxy. Capture it synchronously BEFORE Angular bootstraps.
 */
let transientInvitationToken: string | null = null;

export function captureInvitationFragment(
  path: string, fragment: string, clearUrl: () => void,
): void {
  transientInvitationToken = null;
  if (path !== '/auth/activate') return;
  // Clear even malformed fragments so nothing remains in browser history.
  clearUrl();
  const match = /^#token=([A-F0-9]{64})$/.exec(fragment);
  if (match) transientInvitationToken = match[1];
}

export function captureInitialInvitationFragment(): void {
  captureInvitationFragment(
    window.location.pathname,
    window.location.hash,
    () => window.history.replaceState(
      window.history.state, '', window.location.pathname + window.location.search),
  );
}

export function takeInvitationToken(): string | null {
  const value = transientInvitationToken;
  transientInvitationToken = null;
  return value;
}
