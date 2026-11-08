import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TenantFirstLoginComponent } from './tenant-first-login.component';

describe('FR-13B-3 first-login forced password change', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantFirstLoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function readyComponent() {
    const fixture = TestBed.createComponent(TenantFirstLoginComponent);
    fixture.detectChanges();
    // These unit tests isolate the two-step protocol. Real deployed host/HTTPS
    // enforcement remains a separately required staging browser acceptance.
    fixture.componentInstance.ready.set(true);
    (fixture.componentInstance as unknown as { tenantSlug: string }).tenantSlug = 'demo';
    return fixture;
  }

  it('never turns an initial password into a normal OAuth session', async () => {
    const challenge = 'A'.repeat(64);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ challenge, requiresPasswordChange: true }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ passwordChanged: true, requiresRelogin: true }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = readyComponent();
    const component = fixture.componentInstance;
    component.startForm.setValue({
      userName: 'employee', temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    });
    await component.begin();
    expect(component.step()).toBe('change');
    expect(component.startForm.controls.temporaryPassword.value).toBe('');
    expect(component.startForm.controls.userName.value).toBe('');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const first = fetchMock.mock.calls[0];
    expect(first[0]).toContain('/public/tenant-first-login/start');
    expect(first[1].credentials).toBe('omit');
    expect(first[1].redirect).toBe('error');
    expect(JSON.parse(first[1].body)).toEqual({
      tenantSlug: 'demo', userName: 'employee',
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    });

    component.changeForm.setValue({
      newPassword: 'New-Permanent-Strong-Passphrase-2026!',
      confirm: 'New-Permanent-Strong-Passphrase-2026!',
    });
    await component.changePassword();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = fetchMock.mock.calls[1];
    expect(second[0]).toContain('/public/tenant-first-login/complete');
    expect(JSON.parse(second[1].body)).toEqual({
      tenantSlug: 'demo', challenge,
      newPassword: 'New-Permanent-Strong-Passphrase-2026!',
    });
    expect(second[1].credentials).toBe('omit');
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { passwordChanged: '1' }, replaceUrl: true,
    });
    expect(component.changeForm.controls.newPassword.value).toBe('');
    expect(component.changeForm.controls.confirm.value).toBe('');
    expect(component.ready()).toBe(false);
    fixture.destroy();
  });

  it('rejects failed initial credential and does not open password change', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const fixture = readyComponent();
    const component = fixture.componentInstance;
    component.startForm.setValue({
      userName: 'employee', temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    });
    await component.begin();
    expect(component.step()).toBe('credentials');
    expect(component.error()).toContain('نامعتبر');
    expect(component.startForm.controls.temporaryPassword.value).toBe('');
    fixture.destroy();
  });

  it('clears challenge and requires new first-login exchange on expiry', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ challenge: 'A'.repeat(64), requiresPasswordChange: true }),
      })
      .mockResolvedValueOnce({ ok: false, status: 400 });
    vi.stubGlobal('fetch', fetchMock);
    const fixture = readyComponent();
    const component = fixture.componentInstance;
    component.startForm.setValue({
      userName: 'employee', temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
    });
    await component.begin();
    component.changeForm.setValue({
      newPassword: 'New-Permanent-Strong-Passphrase-2026!',
      confirm: 'New-Permanent-Strong-Passphrase-2026!',
    });
    await component.changePassword();
    expect(component.step()).toBe('credentials');
    expect(component.error()).toContain('منقضی');
    expect(component.changeForm.controls.newPassword.value).toBe('');
    fixture.destroy();
  });
});
