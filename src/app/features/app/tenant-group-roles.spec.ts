import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantGroupRolesComponent } from './tenant-group-roles.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant Group role editor', () => {
  const groupId = '11111111-1111-1111-1111-111111111111';
  const roleId = '22222222-2222-2222-2222-222222222222';
  const role = { id: roleId, name: 'Reception', isActive: true, assigned: false };
  const version = 'AQIDBAUGBwg=';
  const matrix = {
    groupId, groupName: 'Reception Team', version,
    groupIsActive: true, canEdit: true, items: [role], page: 1, hasNext: true,
  };
  const getGroupRoles = vi.fn();
  const changeGroupRole = vi.fn();

  beforeEach(async () => {
    getGroupRoles.mockReset().mockReturnValue(of(matrix));
    changeGroupRole.mockReset().mockReturnValue(of({ version: 'AgMEBQYHCAk=' }));
    await TestBed.configureTestingModule({
      imports: [TenantGroupRolesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: {
          getGroupRoles, changeGroupRole,
        } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: groupId }) },
        } },
      ],
    }).compileComponents();
  });

  it('shows ordinary roles and confirms only the exact GroupRole pair', () => {
    const fixture = TestBed.createComponent(TenantGroupRolesComponent);
    fixture.detectChanges();
    expect(getGroupRoles).toHaveBeenCalledWith(groupId, 1);
    fixture.componentInstance.requestChange(role);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('تأیید تغییر نقش');
    expect(changeGroupRole).not.toHaveBeenCalled();
    fixture.componentInstance.confirmChange();
    expect(changeGroupRole).toHaveBeenCalledExactlyOnceWith(
      groupId, roleId, true, version);
    expect(getGroupRoles).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('pages the list and never sends all roles as a replacement', () => {
    getGroupRoles.mockReturnValueOnce(of(matrix)).mockReturnValueOnce(of({
      ...matrix, page: 2, hasNext: false, items: [],
    }));
    const fixture = TestBed.createComponent(TenantGroupRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(getGroupRoles).toHaveBeenCalledWith(groupId, 2);
    expect(changeGroupRole).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('نقش عادی');
    fixture.destroy();
  });

  it('disallows new links to disabled Group or Role, but permits revoke', () => {
    const existing = { ...role, id: '33333333-3333-3333-3333-333333333333',
      isActive: false, assigned: true };
    getGroupRoles.mockReturnValue(of({
      ...matrix, groupIsActive: false, items: [role, existing],
    }));
    const fixture = TestBed.createComponent(TenantGroupRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(role);
    expect(fixture.componentInstance.pending()).toBeNull();
    fixture.componentInstance.requestChange(existing);
    fixture.componentInstance.confirmChange();
    expect(changeGroupRole).toHaveBeenCalledWith(
      groupId, existing.id, false, version);
    fixture.destroy();
  });

  it('keeps grants unavailable without Owner canEdit and clears stale data on 403', () => {
    getGroupRoles.mockReturnValueOnce(of({ ...matrix, canEdit: false }));
    const fixture = TestBed.createComponent(TenantGroupRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(role);
    fixture.componentInstance.confirmChange();
    expect(changeGroupRole).not.toHaveBeenCalled();
    fixture.destroy();

    changeGroupRole.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const denied = TestBed.createComponent(TenantGroupRolesComponent);
    denied.detectChanges();
    denied.componentInstance.requestChange(role);
    denied.componentInstance.confirmChange();
    denied.detectChanges();
    expect(denied.componentInstance.matrix()).toBeNull();
    expect(denied.nativeElement.textContent).toContain('مجوز تغییر نقش');
    denied.destroy();
  });

  it('reloads a 409 without automatically replaying a stale role write', () => {
    changeGroupRole.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const fixture = TestBed.createComponent(TenantGroupRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(role);
    fixture.componentInstance.confirmChange();
    fixture.detectChanges();
    expect(getGroupRoles).toHaveBeenCalledTimes(2);
    expect(changeGroupRole).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.pending()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('نسخه جدید');
    fixture.destroy();
  });
});
