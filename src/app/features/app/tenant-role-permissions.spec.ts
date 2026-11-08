import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantRolePermissionsComponent } from './tenant-role-permissions.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

const roleId = '11111111-1111-4111-8111-111111111111';
describe('Tenant role permission matrix (read only)', () => {
  const getRolePermissions = vi.fn();
  beforeEach(async () => {
    getRolePermissions.mockReset().mockReturnValue(of({
      roleId, roleName: 'Operator',
      permissions: [
        { code: 'TENANT.MEMBERS.READ', name: 'View members',
          kind: 'PAGE', route: '/dashboard/members', registered: true, granted: true },
        { code: 'TENANT.BRANCHES.MANAGE', name: 'Manage branches',
          kind: 'ACTION', route: '/dashboard/branches', registered: false, granted: false },
      ],
    }));
    await TestBed.configureTestingModule({
      imports: [TenantRolePermissionsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: roleId }) },
        } },
        { provide: TenantWorkspaceService, useValue: { getRolePermissions } },
      ],
    }).compileComponents();
  });
  it('displays exact direct grants and unregistered states without writing', () => {
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Operator');
    expect(text).toContain('تخصیص مستقیم دارد');
    expect(text).toContain('ثبت‌نشده در کاتالوگ');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(getRolePermissions).toHaveBeenCalledWith(roleId);
    fixture.destroy();
  });
  it('clears role data when permission is revoked with HTTP 403', () => {
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    getRolePermissions.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.matrix()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('دسترسی لازم');
    fixture.destroy();
  });
});
