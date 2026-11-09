import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TenantMemberAuditComponent } from './tenant-member-audit.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant member audit read-only page', () => {
  const getMemberAudit = vi.fn();
  const memberId = '11111111-1111-1111-1111-111111111111';
  const entry = {
    id: '22222222-2222-2222-2222-222222222222',
    category: 'member_role', action: 'grant',
    occurredAtUtc: '2026-11-09T10:00:00Z',
    actorUserId: 'owner-1', actorUserName: 'owner',
    targetUserId: memberId, targetUserName: 'staff',
    roleName: 'Reception',
  };

  beforeEach(async () => {
    getMemberAudit.mockReset().mockReturnValue(of({
      items: [entry], pageNumber: 1, hasNext: true,
    }));
    await TestBed.configureTestingModule({
      imports: [TenantMemberAuditComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: { getMemberAudit } },
        { provide: ActivatedRoute, useValue: {
          queryParamMap: of(convertToParamMap({ memberId })),
        } },
      ],
    }).compileComponents();
  });

  it('shows Persian audit details, no credentials and a server-derived member filter', () => {
    const f = TestBed.createComponent(TenantMemberAuditComponent);
    f.detectChanges();
    expect(getMemberAudit).toHaveBeenCalledWith(1, memberId);
    expect(f.nativeElement.textContent).toContain('نقش اعطا شد');
    expect(f.nativeElement.textContent).toContain('Reception');
    expect(f.nativeElement.textContent).toContain('owner');
    expect(f.nativeElement.textContent).toContain('staff');
    expect(f.nativeElement.textContent).not.toContain('رمز عبور موقت:');
    expect(f.nativeElement.querySelector('time')?.getAttribute('datetime'))
      .toBe('2026-11-09T10:00:00Z');
    expect(f.nativeElement.querySelector('form')).toBeNull();
    f.destroy();
  });

  it('pages bounded server results without accepting an arbitrary tenant', () => {
    const f = TestBed.createComponent(TenantMemberAuditComponent);
    f.detectChanges();
    getMemberAudit.mockReturnValueOnce(of({
      items: [], pageNumber: 2, hasNext: false,
    }));
    f.componentInstance.next();
    f.detectChanges();
    expect(getMemberAudit).toHaveBeenCalledWith(2, memberId);
    expect(f.nativeElement.textContent).toContain('رویدادی برای این فیلتر');
    expect(f.componentInstance.audit()?.hasNext).toBe(false);
    f.componentInstance.next();
    expect(getMemberAudit).toHaveBeenCalledTimes(2);
    f.componentInstance.previous();
    expect(getMemberAudit).toHaveBeenCalledWith(1, memberId);
    f.destroy();
  });

  it('clears sensitive event data on 403 revocation and blocks automatic retries', () => {
    const f = TestBed.createComponent(TenantMemberAuditComponent);
    f.detectChanges();
    getMemberAudit.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    f.componentInstance.load();
    f.detectChanges();
    expect(f.componentInstance.audit()).toBeNull();
    expect(f.nativeElement.textContent).toContain('مجوز مشاهده تاریخچه');
    expect(f.componentInstance.canRetry()).toBe(false);
    f.componentInstance.load();
    expect(getMemberAudit).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('keeps loading and error states explicit for a real pending HTTP request', () => {
    const pending = new Subject<{
      items: (typeof entry)[];
      pageNumber: number;
      hasNext: boolean;
    }>();
    getMemberAudit.mockReturnValueOnce(pending.asObservable());
    const f = TestBed.createComponent(TenantMemberAuditComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('در حال دریافت تاریخچه');
    pending.next({ items: [entry], pageNumber: 1, hasNext: false });
    pending.complete();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('نقش اعطا شد');
    f.destroy();
  });
});
