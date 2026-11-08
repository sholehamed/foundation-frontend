import {
  captureInvitationFragment, takeInvitationToken,
} from './tenant-invitation-token';

describe('FR-13B-2 invitation URL secrecy', () => {
  const token = 'A'.repeat(64);

  it('captures a valid fragment for the public activation route only and erases the URL', () => {
    const erase = vi.fn();
    captureInvitationFragment('/auth/activate', '#token=' + token, erase);
    expect(erase).toHaveBeenCalledTimes(1);
    expect(takeInvitationToken()).toBe(token);
    expect(takeInvitationToken()).toBeNull();
  });

  it('erases malformed fragments rather than routing or persisting a secret', () => {
    const erase = vi.fn();
    captureInvitationFragment('/auth/activate', '#token=wrong', erase);
    expect(erase).toHaveBeenCalledTimes(1);
    expect(takeInvitationToken()).toBeNull();
  });

  it('does not read unrelated route fragments as invitations', () => {
    const erase = vi.fn();
    captureInvitationFragment('/auth/login', '#token=' + token, erase);
    expect(erase).not.toHaveBeenCalled();
    expect(takeInvitationToken()).toBeNull();
  });

  it('clears an earlier captured token when a new route is processed', () => {
    captureInvitationFragment('/auth/activate', '#token=' + token, vi.fn());
    captureInvitationFragment('/dashboard', '#token=' + token, vi.fn());
    expect(takeInvitationToken()).toBeNull();
  });
});
