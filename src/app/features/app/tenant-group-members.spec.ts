import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantGroupMembersComponent } from './tenant-group-members.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant Group member editor', () => {
  const groupId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const member = { id: userId, userName: 'staff', assigned: false };
  const version = 'AQIDBAUGBwg=';
  const matrix = {
    groupId, groupName: 'Reception', version, groupIsActive: true,
    canEdit: true, items: [member], page: 1, hasNext: true,
  };
  const getGroupMembers = vi.fn();
  const changeGroupMember = vi.fn();

  beforeEach(async () => {
    getGroupMembers.mockReset().mockReturnValue(of(matrix));
    changeGroupMember.mockReset().mockReturnValue(of({ version: 'AgMEBQYHCAk=' }));
    await TestBed.configureTestingModule({
      imports: [TenantGroupMembersComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: {
          getGroupMembers, changeGroupMember,
        } },
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: groupId }) },
        } },
      ],
    }).compileComponents();
  });

  it('shows a paged ordinary user, confirms one pair and sends only CAS body', () => {
    const fixture = TestBed.createComponent(TenantGroupMembersComponent);
    fixture.detectChanges();
    expect(getGroupMembers).toHaveBeenCalledWith(groupId, 1);
    fixture.componentInstance.requestChange(member);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('تأیید افزودن عضو به گروه');
    expect(changeGroupMember).not.toHaveBeenCalled();
    fixture.componentInstance.confirmChange();
    expect(changeGroupMember).toHaveBeenCalledExactlyOnceWith(
      groupId, userId, true, version);
    expect(getGroupMembers).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.pending()).toBeNull();
    fixture.destroy();
  });

  it('pages without replacing the entire Group membership set', () => {
    getGroupMembers.mockReturnValueOnce(of(matrix)).mockReturnValueOnce(of({
      ...matrix, page: 2, hasNext: false, items: [],
    }));
    const fixture = TestBed.createComponent(TenantGroupMembersComponent);
    fixture.detectChanges();
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(getGroupMembers).toHaveBeenCalledWith(groupId, 2);
    expect(fixture.nativeElement.textContent).toContain('عضو واجد شرایطی');
    expect(changeGroupMember).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('never offers a new member for an inactive Group but permits revocation', () => {
    getGroupMembers.mockReturnValue(of({
      ...matrix, groupIsActive: false, items: [
        member, { ...member, id: '33333333-3333-3333-3333-333333333333',
          userName: 'already-linked', assigned: true },
      ],
    }));
    const fixture = TestBed.createComponent(TenantGroupMembersComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(member);
    expect(fixture.componentInstance.pending()).toBeNull();
    const existing = fixture.componentInstance.matrix()!.items[1];
    fixture.componentInstance.requestChange(existing);
    fixture.componentInstance.confirmChange();
    expect(changeGroupMember).toHaveBeenCalledWith(
      groupId, existing.id, false, version);
    fixture.destroy();
  });

  it('blocks writes for read-only users and fails closed on 403', () => {
    getGroupMembers.mockReturnValue(of({ ...matrix, canEdit: false }));
    const fixture = TestBed.createComponent(TenantGroupMembersComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(member);
    fixture.componentInstance.confirmChange();
    expect(changeGroupMember).not.toHaveBeenCalled();
    fixture.destroy();

    getGroupMembers.mockReturnValue(of(matrix));
    changeGroupMember.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const denied = TestBed.createComponent(TenantGroupMembersComponent);
    denied.detectChanges();
    denied.componentInstance.requestChange(member);
    denied.componentInstance.confirmChange();
    denied.detectChanges();
    expect(denied.componentInstance.matrix()).toBeNull();
    expect(denied.nativeElement.textContent).toContain('مجوز تغییر عضویت');
    denied.destroy();
  });

  it('forces fresh matrix load on 409 without repeating the old grant', () => {
    changeGroupMember.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const fixture = TestBed.createComponent(TenantGroupMembersComponent);
    fixture.detectChanges();
    fixture.componentInstance.requestChange(member);
    fixture.componentInstance.confirmChange();
    fixture.detectChanges();
    expect(getGroupMembers).toHaveBeenCalledTimes(2);
    expect(changeGroupMember).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.pending()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('هم‌زمان تغییر کرده');
    fixture.destroy();
  });
});
