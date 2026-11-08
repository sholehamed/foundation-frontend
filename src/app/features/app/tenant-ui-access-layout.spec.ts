import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantWorkspaceLayoutComponent } from './tenant-workspace-layout.component';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { AuthService } from '../../shared/services/auth.service';

describe('Tenant workspace navigation from live PAGE access snapshot', () => {
  const getUiAccess = vi.fn();
  beforeEach(async () => {
    getUiAccess.mockReset();
    await TestBed.configureTestingModule({
      imports: [TenantWorkspaceLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: { getUiAccess } },
        { provide: AuthService, useValue: { logout: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('shows only individually granted directory routes', () => {
    getUiAccess.mockReturnValue(of({ entries: [
      { key: 'TENANT.MEMBERS.READ', kind: 'PAGE',
        route: '/dashboard/members', allowed: true },
      { key: 'TENANT.ROLES.READ', kind: 'PAGE',
        route: '/dashboard/roles', allowed: false },
      { key: 'TENANT.GROUPS.READ', kind: 'PAGE',
        route: '/dashboard/groups', allowed: true },
    ] }));
    const fixture = TestBed.createComponent(TenantWorkspaceLayoutComponent);
    fixture.detectChanges();
    const links = [...fixture.nativeElement.querySelectorAll('nav a')]
      .map((element: HTMLAnchorElement) => element.textContent?.trim());
    expect(links).toContain('اعضا');
    expect(links).toContain('گروه‌ها');
    expect(links).not.toContain('نقش‌ها');
    fixture.destroy();
  });

  it('hides all privileged links on failed snapshot', () => {
    getUiAccess.mockReturnValue(throwError(() => new Error('network failure')));
    const fixture = TestBed.createComponent(TenantWorkspaceLayoutComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('nav').textContent;
    expect(text).not.toContain('نقش‌ها');
    expect(text).not.toContain('اعضا');
    expect(text).not.toContain('گروه‌ها');
    expect(text).toContain('شعبه‌ها');
    fixture.destroy();
  });
});
