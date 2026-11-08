import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantRolePermissionsComponent } from './tenant-role-permissions.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

const roleId = '11111111-1111-4111-8111-111111111111';
describe('Tenant role permission matrix (read only)', () => {
  const getRolePermissions = vi.fn();
  const replaceRolePermissions = vi.fn();
  beforeEach(async () => {
    replaceRolePermissions.mockReset().mockReturnValue(of({ version: 'AAAAAAAABAE=' }));
    getRolePermissions.mockReset().mockReturnValue(of({
      roleId, roleName: 'Operator', version: 'AAAAAAAABAA=', canEdit: false,
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
        { provide: TenantWorkspaceService, useValue: { getRolePermissions, replaceRolePermissions } },
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
  it('shows the editor for an eligible owner and sends only code-owned grants + version', () => {
    getRolePermissions.mockReturnValue(of({
      roleId, roleName: 'Operator', version: 'AAAAAAAABAA=', canEdit: true,
      permissions: [
        { code: 'TENANT.MEMBERS.READ', name: 'Read members',
          kind: 'PAGE', route: '/dashboard/members', registered: true, granted: false },
        { code: 'TENANT.ROLES.READ', name: 'Read roles',
          kind: 'PAGE', route: '/dashboard/roles', registered: true, granted: true },
      ],
    }));
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.beginEdit();
    component.toggle('TENANT.MEMBERS.READ', true);
    expect(component.hasChanges()).toBe(true);
    component.save();
    expect(replaceRolePermissions).toHaveBeenCalledWith(roleId, 'AAAAAAAABAA=', [
      'TENANT.MEMBERS.READ', 'TENANT.ROLES.READ',
    ]);
    expect(component.editMode()).toBe(false);
    expect(getRolePermissions).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('never shows editing or calls PUT without backend canEdit', () => {
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    fixture.componentInstance.beginEdit();
    fixture.componentInstance.toggle('TENANT.MEMBERS.READ', false);
    fixture.componentInstance.save();
    expect(fixture.componentInstance.editMode()).toBe(false);
    expect(replaceRolePermissions).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('reloads on concurrency 409 instead of overwriting a newer role version', () => {
    getRolePermissions.mockReturnValue(of({
      roleId, roleName: 'Operator', version: 'AAAAAAAABAA=', canEdit: true,
      permissions: [{ code: 'TENANT.MEMBERS.READ', name: 'Members',
        kind: 'PAGE', route: '/dashboard/members', registered: true, granted: false }],
    }));
    replaceRolePermissions.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    fixture.componentInstance.beginEdit();
    fixture.componentInstance.toggle('TENANT.MEMBERS.READ', true);
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.editMode()).toBe(false);
    expect(getRolePermissions).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('نسخه نقش تغییر کرده است');
    fixture.destroy();
  });

  it('clears stale matrix when a grant mutation loses authorization', () => {
    getRolePermissions.mockReturnValue(of({
      roleId, roleName: 'Operator', version: 'AAAAAAAABAA=', canEdit: true,
      permissions: [{ code: 'TENANT.MEMBERS.READ', name: 'Members',
        kind: 'PAGE', route: '/dashboard/members', registered: true, granted: false }],
    }));
    replaceRolePermissions.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const fixture = TestBed.createComponent(TenantRolePermissionsComponent);
    fixture.detectChanges();
    fixture.componentInstance.beginEdit();
    fixture.componentInstance.toggle('TENANT.MEMBERS.READ', true);
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.matrix()).toBeNull();
    expect(fixture.componentInstance.editMode()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('مجوز مدیریت این نقش');
    fixture.destroy();
  });

});
