import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { TenantAdminDirectoryComponent } from './tenant-admin-directory.component';

describe('Tenant owner directory pages', () => {
  const getMembers = vi.fn();
  const getRoles = vi.fn();
  const getGroups = vi.fn();
  const getAdminCapabilities = vi.fn();
  const createPendingMember = vi.fn();
  const invitePendingMember = vi.fn();
  const issueTemporaryPassword = vi.fn();
  const createMemberWithInitialPassword = vi.fn();

  beforeEach(async () => {
    getMembers.mockReset().mockReturnValue(of({ items: [{
      id: 'owned', userName: 'owner', email: 'owner@test.local',
      firstName: 'Local', lastName: 'Owner', isActive: true,
    }], page: 1, hasNext: true }));
    getRoles.mockReset().mockReturnValue(of({ items: [], page: 1, hasNext: false }));
    getGroups.mockReset().mockReturnValue(of({ items: [], page: 1, hasNext: false }));
    getAdminCapabilities.mockReset().mockReturnValue(of({ canViewMembers: true, canCreateMembers: true }));
    createPendingMember.mockReset();
    invitePendingMember.mockReset();
    issueTemporaryPassword.mockReset();
    createMemberWithInitialPassword.mockReset();
    environment.tenantFirstLoginEnabled = true;
    await TestBed.configureTestingModule({
      imports: [TenantAdminDirectoryComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ directoryKind: 'members' }) } },
        { provide: TenantWorkspaceService, useValue: {
          getMembers, getRoles, getGroups, getAdminCapabilities, createPendingMember, invitePendingMember,
          issueTemporaryPassword, createMemberWithInitialPassword,
        } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    environment.tenantFirstLoginEnabled = false;
  });

  it('renders only the current tenant API fields and supports paging', () => {
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Local Owner');
    expect(f.nativeElement.textContent).toContain('owner@test.local');
    expect(getMembers).toHaveBeenCalledWith(1);
    f.componentInstance.next();
    expect(getMembers).toHaveBeenCalledWith(2);
    expect(getRoles).not.toHaveBeenCalled();
    f.destroy();
  });

  it('clears stale rows after owner revoke / 403', () => {
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    getMembers.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    f.componentInstance.load();
    f.detectChanges();
    expect(f.componentInstance.result()).toBeNull();
    expect(f.nativeElement.textContent).toContain('مجوز معتبر');
    f.destroy();
  });
  it('hides inactive creation when the server denies it', () => {
    getAdminCapabilities.mockReturnValue(of({ canViewMembers: true, canCreateMembers: false }));
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    expect(f.componentInstance.canCreateMembers()).toBe(false);
    expect(f.nativeElement.textContent).not.toContain('ثبت عضو غیرفعال');
    f.componentInstance.openCreate();
    expect(f.componentInstance.createOpen()).toBe(false);
    expect(createPendingMember).not.toHaveBeenCalled();
    f.destroy();
  });

  it('creates only an inactive member after a fresh capability check', () => {
    createPendingMember.mockReturnValue(of({
      id: 'new-staff', userName: 'new.staff', email: 'new@local.test',
      firstName: 'New', lastName: 'Staff', isActive: false,
    }));
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    expect(f.componentInstance.canCreateMembers()).toBe(true);
    f.componentInstance.openCreate();
    f.componentInstance.userName.set('new.staff');
    f.componentInstance.email.set('new@local.test');
    f.componentInstance.firstName.set('New');
    f.componentInstance.lastName.set('Staff');
    f.componentInstance.create();
    expect(getAdminCapabilities).toHaveBeenCalledTimes(3);
    expect(createPendingMember).toHaveBeenCalledWith({
      userName: 'new.staff', email: 'new@local.test', firstName: 'New', lastName: 'Staff',
    });
    expect(f.componentInstance.createOpen()).toBe(false);
    expect(f.componentInstance.notice()).toContain('هنوز دعوت‌نامه');
    expect(getMembers).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('fails closed on permission revocation before sending POST', () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: true,
    })).mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: false,
    }));
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    f.componentInstance.openCreate();
    f.componentInstance.userName.set('new.staff');
    f.componentInstance.email.set('new@local.test');
    f.componentInstance.firstName.set('New');
    f.componentInstance.lastName.set('Staff');
    f.componentInstance.create();
    expect(createPendingMember).not.toHaveBeenCalled();
    expect(f.componentInstance.canCreateMembers()).toBe(false);
    expect(f.componentInstance.result()).toBeNull();
    expect(f.componentInstance.error()).toContain('لغو شده');
    f.destroy();
  });

  it('submits an invitation only for inactive staff with freshly allowed Owner capability', () => {
    getMembers.mockReturnValue(of({ items: [
      { id: 'pending', userName: 'new.staff', email: 'new@local.test',
        firstName: 'New', lastName: 'Staff', isActive: false },
    ], page: 1, hasNext: false }));
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: true, canInviteMembers: true,
    }));
    invitePendingMember.mockReturnValue(of({
      status: 'submitted', expiresAtUtc: '2026-11-09T12:30:00Z',
    }));
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    expect(f.componentInstance.canInviteMembers()).toBe(true);
    f.componentInstance.inviteMember('pending');
    expect(getAdminCapabilities).toHaveBeenCalledTimes(2);
    expect(invitePendingMember).toHaveBeenCalledOnce();
    expect(invitePendingMember).toHaveBeenCalledWith('pending');
    expect(f.componentInstance.notice()).toContain('سرویس ایمیل');
    expect(f.componentInstance.notice()).toContain('تأیید نشده');
    f.destroy();
  });

  it('blocks invitation if capability was revoked before sending', () => {
    getMembers.mockReturnValue(of({ items: [
      { id: 'pending', userName: 'new.staff', email: 'new@local.test',
        firstName: 'New', lastName: 'Staff', isActive: false },
    ], page: 1, hasNext: false }));
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: false, canInviteMembers: true,
    })).mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: false, canInviteMembers: false,
    }));
    const f = TestBed.createComponent(TenantAdminDirectoryComponent);
    f.detectChanges();
    f.componentInstance.inviteMember('pending');
    expect(invitePendingMember).not.toHaveBeenCalled();
    expect(f.componentInstance.canInviteMembers()).toBe(false);
    expect(f.componentInstance.result()).toBeNull();
    expect(f.componentInstance.inviteError()).toContain('لغو شده');
    f.destroy();
  });

  it('shows a one-time initial credential only after live Owner capability', () => {
    getMembers.mockReturnValue(of({ items: [
      { id: 'pending', userName: 'new.staff', email: 'new@test.local',
        firstName: 'New', lastName: 'Staff', isActive: false },
    ], page: 1, hasNext: false }));
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: false,
      canInviteMembers: false, canIssueTemporaryPassword: true,
    }));
    issueTemporaryPassword.mockReturnValue(of({
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
      expiresAtUtc: '2026-11-09T12:30:00Z',
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.canIssueTemporaryPassword()).toBe(true);
    fixture.componentInstance.issueTemporaryPassword('pending', 'new.staff');
    expect(getAdminCapabilities).toHaveBeenCalledTimes(2);
    expect(issueTemporaryPassword).toHaveBeenCalledWith('pending');
    expect(fixture.componentInstance.temporarySecret()?.password)
      .toBe('ABCDEF-ghijkl-MNOPQR-stuvwx');
    fixture.componentInstance.closeTemporarySecret();
    expect(fixture.componentInstance.temporarySecret()).toBeNull();
    fixture.destroy();
  });

  it('does not issue an initial credential if Owner permission is revoked', () => {
    getMembers.mockReturnValue(of({ items: [
      { id: 'pending', userName: 'new.staff', email: 'new@test.local',
        firstName: 'New', lastName: 'Staff', isActive: false },
    ], page: 1, hasNext: false }));
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMembers: true, canIssueTemporaryPassword: true,
    })).mockReturnValueOnce(of({
      canViewMembers: true, canIssueTemporaryPassword: false,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    fixture.componentInstance.issueTemporaryPassword('pending', 'new.staff');
    expect(issueTemporaryPassword).not.toHaveBeenCalled();
    expect(fixture.componentInstance.canIssueTemporaryPassword()).toBe(false);
    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.componentInstance.temporarySecret()).toBeNull();
    fixture.destroy();
  });

  it('never allows Owner to reveal an initial secret on an active row', () => {
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canIssueTemporaryPassword: true,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    fixture.componentInstance.issueTemporaryPassword('owned', 'owner');
    expect(issueTemporaryPassword).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('creates inactive employee and issues one-time initial password with one atomic call', () => {
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: true, canIssueTemporaryPassword: true,
    }));
    createMemberWithInitialPassword.mockReturnValue(of({
      member: {
        id: 'created-id', userName: 'new.staff', email: 'new@local.test',
        firstName: 'New', lastName: 'Staff', isActive: false,
      },
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
      expiresAtUtc: '2026-11-09T12:30:00Z',
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.canIssueTemporaryPassword()).toBe(true);
    component.openCreate();
    component.userName.set('new.staff');
    component.email.set('new@local.test');
    component.firstName.set('New');
    component.lastName.set('Staff');
    component.create();
    expect(createMemberWithInitialPassword).toHaveBeenCalledWith({
      userName: 'new.staff', email: 'new@local.test',
      firstName: 'New', lastName: 'Staff',
    });
    expect(createPendingMember).not.toHaveBeenCalled();
    expect(issueTemporaryPassword).not.toHaveBeenCalled();
    expect(component.temporarySecret()?.password)
      .toBe('ABCDEF-ghijkl-MNOPQR-stuvwx');
    expect(component.createOpen()).toBe(false);
    component.closeTemporarySecret();
    expect(component.temporarySecret()).toBeNull();
    expect(getMembers).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('blocks atomic creation when temporary-password permission was revoked', () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: true, canIssueTemporaryPassword: true,
    })).mockReturnValueOnce(of({
      canViewMembers: true, canCreateMembers: true, canIssueTemporaryPassword: false,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openCreate();
    component.userName.set('new.staff');
    component.email.set('new@local.test');
    component.firstName.set('New');
    component.lastName.set('Staff');
    component.create();
    expect(createMemberWithInitialPassword).not.toHaveBeenCalled();
    expect(createPendingMember).not.toHaveBeenCalled();
    expect(component.saveError()).toContain('لغو شده');
    fixture.destroy();
  });

  it('allows creation with no email and stores null instead of a fake email', () => {
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: true, canIssueTemporaryPassword: false,
    }));
    createPendingMember.mockReturnValue(of({
      id: 'email-less', userName: 'staff.without.email', email: null,
      firstName: 'No', lastName: 'Email', isActive: false,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openCreate();
    component.userName.set('staff.without.email');
    component.firstName.set('No');
    component.lastName.set('Email');
    component.email.set('');
    fixture.detectChanges();
    const emailInput = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    expect(emailInput.required).toBe(false);
    expect(emailInput.validity.valid).toBe(true);
    component.create();
    expect(createPendingMember).toHaveBeenCalledOnce();
    expect(createPendingMember).toHaveBeenCalledWith({
      userName: 'staff.without.email', email: null,
      firstName: 'No', lastName: 'Email',
    });
    expect(component.createOpen()).toBe(false);
    fixture.destroy();
  });

  it('creates email-less member with one atomic initial password and clears it on close', () => {
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: true, canIssueTemporaryPassword: true,
    }));
    createMemberWithInitialPassword.mockReturnValue(of({
      member: {
        id: 'new-without-email', userName: 'staff.local', email: null,
        firstName: 'Local', lastName: 'Staff', isActive: false,
      },
      temporaryPassword: 'ABCDEF-ghijkl-MNOPQR-stuvwx',
      expiresAtUtc: '2026-11-09T12:30:00Z',
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openCreate();
    component.userName.set('staff.local');
    component.firstName.set('Local');
    component.lastName.set('Staff');
    component.email.set(' ');
    component.create();
    expect(createMemberWithInitialPassword).toHaveBeenCalledWith({
      userName: 'staff.local', email: null,
      firstName: 'Local', lastName: 'Staff',
    });
    expect(component.temporarySecret()?.password).toContain('ABCDEF');
    component.closeTemporarySecret();
    expect(component.temporarySecret()).toBeNull();
    fixture.destroy();
  });

  it('never offers or calls email invitation for staff without a recipient', () => {
    getMembers.mockReturnValue(of({
      items: [{
        id: 'no-email', userName: 'local.staff', email: null,
        firstName: 'Local', lastName: 'Staff', isActive: false,
      }], page: 1, hasNext: false,
    }));
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: false,
      canInviteMembers: true, canIssueTemporaryPassword: true,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('بدون ایمیل');
    expect(fixture.nativeElement.textContent).not.toContain('ارسال دعوت‌نامه');
    fixture.componentInstance.inviteMember('no-email');
    expect(invitePendingMember).not.toHaveBeenCalled();
    expect(fixture.componentInstance.result()).not.toBeNull();
    fixture.destroy();
  });

  it('still shows email invite for inactive staff with a genuine email', () => {
    getMembers.mockReturnValue(of({
      items: [{
        id: 'mail-staff', userName: 'mail.staff', email: 'mail.staff@company.test',
        firstName: 'Mail', lastName: 'Staff', isActive: false,
      }], page: 1, hasNext: false,
    }));
    getAdminCapabilities.mockReturnValue(of({
      canViewMembers: true, canCreateMembers: false, canInviteMembers: true,
    }));
    const fixture = TestBed.createComponent(TenantAdminDirectoryComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ارسال دعوت‌نامه');
    fixture.destroy();
  });

});
