import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TenantMemberEffectivePermissionsComponent } from './tenant-member-effective-permissions.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant member effective permission explanation', () => {
  const id = '11111111-1111-1111-1111-111111111111';
  const getMemberEffectivePermissions = vi.fn();
  const groupItem = {
    code: 'TENANT.GROUPS.READ', name: 'View groups', kind: 'PAGE', route: '/dashboard/groups',
    registered: true, allowed: false, decision: 'direct_deny',
    moreSources: false, sources: [
      { kind: 'direct_deny', roleId: null, roleName: null, groupId: null, groupName: null },
      { kind: 'group_role', roleId: 'role-1', roleName: 'Reception',
        groupId: 'group-1', groupName: 'Support' },
    ],
  };
  const roleItem = {
    code: 'TENANT.ROLES.READ', name: 'View roles', kind: 'PAGE', route: '/dashboard/roles',
    registered: true, allowed: true, decision: 'role',
    moreSources: false, sources: [
      { kind: 'role', roleId: 'role-2', roleName: 'Operator',
        groupId: null, groupName: null },
    ],
  };
  const data = {
    userId: id, userName: 'employee', userActive: true, isOwner: false,
    items: [groupItem, roleItem],
  };

  beforeEach(async () => {
    getMemberEffectivePermissions.mockReset().mockReturnValue(of(data));
    await TestBed.configureTestingModule({
      imports: [TenantMemberEffectivePermissionsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: { getMemberEffectivePermissions } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id }) },
        } },
      ],
    }).compileComponents();
  });

  it('shows server decisions and provenance but never offers write controls', () => {
    const f = TestBed.createComponent(TenantMemberEffectivePermissionsComponent);
    f.detectChanges();
    expect(getMemberEffectivePermissions).toHaveBeenCalledExactlyOnceWith(id);
    const text = f.nativeElement.textContent;
    expect(text).toContain('ممنوعیت مستقیم');
    expect(text).toContain('Support');
    expect(text).toContain('Reception');
    expect(text).toContain('Operator');
    expect(text).toContain('نقش');
    expect(text).toContain('مالک بودن');
    expect(f.nativeElement.querySelector('form')).toBeNull();
    expect(f.nativeElement.textContent).not.toContain('رمز اولیه');
    f.destroy();
  });

  it('filters allowed and denied without another HTTP request', () => {
    const f = TestBed.createComponent(TenantMemberEffectivePermissionsComponent);
    f.detectChanges();
    f.componentInstance.setFilter('allowed');
    f.detectChanges();
    expect(f.componentInstance.visible().map(x => x.code))
      .toEqual(['TENANT.ROLES.READ']);
    expect(f.nativeElement.textContent).not.toContain('View groups');
    f.componentInstance.setFilter('denied');
    f.detectChanges();
    expect(f.componentInstance.visible().map(x => x.code))
      .toEqual(['TENANT.GROUPS.READ']);
    expect(getMemberEffectivePermissions).toHaveBeenCalledTimes(1);
    f.destroy();
  });

  it('clears sensitive report and disables retries on permission revocation', () => {
    const f = TestBed.createComponent(TenantMemberEffectivePermissionsComponent);
    f.detectChanges();
    getMemberEffectivePermissions.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    f.componentInstance.load();
    f.detectChanges();
    expect(f.componentInstance.report()).toBeNull();
    expect(f.componentInstance.canRetry()).toBe(false);
    expect(f.nativeElement.textContent).toContain('مجوز مشاهده دسترسی‌ها');
    f.componentInstance.load();
    expect(getMemberEffectivePermissions).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('does not display malformed or cross-member response', () => {
    getMemberEffectivePermissions.mockReturnValueOnce(of({
      ...data, userId: '99999999-9999-9999-9999-999999999999',
    }));
    const f = TestBed.createComponent(TenantMemberEffectivePermissionsComponent);
    f.detectChanges();
    expect(f.componentInstance.report()).toBeNull();
    expect(f.nativeElement.textContent).toContain('پاسخ سرویس');
    f.destroy();
  });

  it('has explicit loading state and accepts an inactive member with no active grants', () => {
    const pending = new Subject<typeof data>();
    getMemberEffectivePermissions.mockReturnValueOnce(pending.asObservable());
    const f = TestBed.createComponent(TenantMemberEffectivePermissionsComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('در حال بررسی دسترسی‌های زنده');
    pending.next({ ...data, userActive: false, items: [
      { ...roleItem, allowed: false, decision: 'account_inactive', sources: [] },
    ] });
    pending.complete();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('غیرفعال');
    expect(f.componentInstance.allowedCount()).toBe(0);
    f.destroy();
  });
});
