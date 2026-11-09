import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TenantGroupAuditComponent } from './tenant-group-audit.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant Group security review page', () => {
  const id = '11111111-1111-1111-1111-111111111111';
  const entry = {
    id: '22222222-2222-2222-2222-222222222222',
    category: 'group_role', action: 'grant',
    occurredAtUtc: '2026-11-09T10:00:00Z',
    actorUserId: 'owner-id', actorUserName: 'Owner',
    targetUserId: null, targetUserName: null,
    roleId: 'role-id', roleName: 'Reception',
    previousName: null, currentName: null,
    previousActive: null, currentActive: null,
  };
  const integrity = {
    memberLinks: 2, roleLinks: 1, ownerMemberLinks: 1,
    invalidMemberLinks: 0, invalidRoleLinks: 0,
    unattributedMemberLinks: 1, unattributedRoleLinks: 0,
  };
  const result = {
    groupId: id, groupName: 'Reception team',
    items: [entry], pageNumber: 1, hasNext: true, integrity,
  };
  const getGroupSecurityAudit = vi.fn();

  beforeEach(async () => {
    getGroupSecurityAudit.mockReset().mockReturnValue(of(result));
    await TestBed.configureTestingModule({
      imports: [TenantGroupAuditComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: { getGroupSecurityAudit } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id }) },
        } },
      ],
    }).compileComponents();
  });

  it('shows a readable, read-only timeline and qualified legacy warning', () => {
    const f = TestBed.createComponent(TenantGroupAuditComponent);
    f.detectChanges();
    expect(getGroupSecurityAudit).toHaveBeenCalledExactlyOnceWith(id, 1);
    expect(f.nativeElement.textContent).toContain('اتصال نقش به گروه');
    expect(f.nativeElement.textContent).toContain('Reception');
    expect(f.nativeElement.textContent).toContain('Owner');
    expect(f.nativeElement.textContent).toContain('منشأ نامشخص');
    expect(f.nativeElement.textContent).toContain('لزوماً نشانه دسترسی غیرمجاز نیست');
    expect(f.nativeElement.querySelector('form')).toBeNull();
    expect(f.nativeElement.querySelector('time')?.getAttribute('datetime'))
      .toBe('2026-11-09T10:00:00Z');
    f.destroy();
  });

  it('paginates only through a bounded server page', () => {
    const f = TestBed.createComponent(TenantGroupAuditComponent);
    f.detectChanges();
    getGroupSecurityAudit.mockReturnValueOnce(of({
      ...result, pageNumber: 2, hasNext: false, items: [],
    }));
    f.componentInstance.next();
    f.detectChanges();
    expect(getGroupSecurityAudit).toHaveBeenCalledWith(id, 2);
    expect(f.nativeElement.textContent).toContain('رویدادی برای این گروه');
    f.componentInstance.next();
    expect(getGroupSecurityAudit).toHaveBeenCalledTimes(2);
    f.componentInstance.previous();
    expect(getGroupSecurityAudit).toHaveBeenCalledWith(id, 1);
    f.destroy();
  });

  it('clears sensitive history and suppresses retry on revoked permission', () => {
    const f = TestBed.createComponent(TenantGroupAuditComponent);
    f.detectChanges();
    getGroupSecurityAudit.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    f.componentInstance.load();
    f.detectChanges();
    expect(f.componentInstance.data()).toBeNull();
    expect(f.componentInstance.canRetry()).toBe(false);
    expect(f.nativeElement.textContent).toContain('مجوز مشاهده تاریخچه گروه');
    f.componentInstance.load();
    expect(getGroupSecurityAudit).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('does not leak old page while a fresh report is loading', () => {
    const pending = new Subject<typeof result>();
    getGroupSecurityAudit.mockReturnValueOnce(pending);
    const f = TestBed.createComponent(TenantGroupAuditComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('در حال دریافت گزارش امنیتی');
    expect(f.componentInstance.data()).toBeNull();
    pending.next(result);
    pending.complete();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('اتصال نقش به گروه');
    f.destroy();
  });

  it('rejects an unexpected response or malformed integrity counters', () => {
    getGroupSecurityAudit.mockReturnValueOnce(of({
      ...result, integrity: { ...integrity, invalidRoleLinks: -1 },
    }));
    const f = TestBed.createComponent(TenantGroupAuditComponent);
    f.detectChanges();
    expect(f.componentInstance.data()).toBeNull();
    expect(f.nativeElement.textContent).toContain('پاسخ تاریخچه امنیتی گروه معتبر نیست');
    f.destroy();
  });
});
