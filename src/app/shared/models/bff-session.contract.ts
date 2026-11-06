/**
 * Frozen BFF /bff/session response contract.
 *
 * This is a type-only handoff for the future BFF-06 client migration; current
 * Angular runtime still authenticates via the legacy bearer/Password Grant.
 * No OAuth tokens, cookies, refresh secrets or server ticket keys go here.
 */
export type BffAccountContext = 'system' | 'tenant';

export interface BffSessionUser {
  id: string;
  username: string | null;
  displayName: string | null;
}

export type BffSessionContext =
  | { type: 'system'; tenantId: null; tenantSlug: null }
  | { type: 'tenant'; tenantId: string; tenantSlug: string };

export interface BffSessionResponse {
  authenticated: true;
  user: BffSessionUser;
  context: BffSessionContext;
}

/** Explicit browser 401/403 are HTTP errors, not authenticated:false payloads. */
