import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantRolesComponent } from './tenant-roles.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant role lifecycle page', () => {
  const getRoles = vi.fn();
  const getAdminCapabilities = vi.fn();
  const createRole = vi.fn();
  const updateRole = vi.fn();
  const changeRoleState = vi.fn();

  const owner = {
    id: 'owner', name: 'Owner', description: 'Protected', isActive: true,
    isOwner: true, version: 'AQIDBAUGBwg=',
  };
  const staff = {
    id: 'staff', name: 'Reception', description: 'Front desk', isActive: true,
    isOwner: false, version: 'AQIDBAUGBwg=',
  };
  const capabilities = {
    canViewAdministration: true, canViewMembers: true, canViewRoles: true,
    canViewGroups: true, canManageBranches: true, canCreateRoles: true,
    canUpdateRoles: true, canChangeRoleState: true,
  };

  beforeEach(async () => {
    getRoles.mockReset().mockReturnValue(of({
      items: [owner, staff], page: 1, hasNext: false,
    }));
    getAdminCapabilities.mockReset().mockReturnValue(of(capabilities));
    createRole.mockReset().mockReturnValue(of(staff));
    updateRole.mockReset().mockReturnValue(of(staff));
    changeRoleState.mockReset().mockReturnValue(of({ ...staff, isActive: false }));
    await TestBed.configureTestingModule({
      imports: [TenantRolesComponent],
      providers: [
        provideRouter([]),
        { provide: TenantWorkspaceService, useValue: {
          getRoles, getAdminCapabilities, createRole, updateRole, changeRoleState,
        } },
      ],
    }).compileComponents();
  });

  it('shows protected Owner without edit, then creates zero-grant role payload', () => {
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('نقش مالک');
    expect(component.roles()?.items.length).toBe(2);
    component.openCreate();
    component.form.setValue({ name: '  Front Desk  ', description: '  Desk  ' });
    component.save();
    expect(createRole).toHaveBeenCalledWith({
      name: 'Front Desk', description: 'Desk',
    });
    expect(getRoles).toHaveBeenCalledTimes(2);
    expect(component.editorOpen()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('بدون هیچ مجوزی');
    fixture.destroy();
  });

  it('updates role metadata with SQL version without touching permissions or tenant', () => {
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openEdit(staff);
    component.form.setValue({ name: 'New Reception', description: '' });
    component.save();
    expect(updateRole).toHaveBeenCalledWith('staff', {
      name: 'New Reception', description: null, expectedVersion: staff.version,
    });
    expect(createRole).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('requires explicit confirmation for deactivation and sends RowVersion', () => {
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.requestStateChange(staff);
    expect(component.pendingState()?.id).toBe('staff');
    expect(changeRoleState).not.toHaveBeenCalled();
    component.confirmState();
    expect(changeRoleState).toHaveBeenCalledWith('staff', {
      isActive: false, expectedVersion: staff.version,
    });
    expect(component.pendingState()).toBeNull();
    fixture.destroy();
  });

  it('does not expose mutation controls without individual server capabilities', () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      ...capabilities, canCreateRoles: false, canUpdateRoles: false, canChangeRoleState: false,
    }));
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openCreate();
    component.openEdit(staff);
    component.requestStateChange(staff);
    expect(component.editorOpen()).toBe(false);
    expect(component.pendingState()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('ساخت نقش جدید');
    expect(createRole).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('refreshes on 409 without retrying stale role changes', () => {
    updateRole.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openEdit(staff);
    component.form.setValue({ name: 'New Reception', description: '' });
    component.save();
    fixture.detectChanges();
    expect(component.editorOpen()).toBe(false);
    expect(getRoles).toHaveBeenCalledTimes(2);
    expect(updateRole).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('نام تکراری');
    fixture.destroy();
  });

  it('fails closed on owner revocation / 403 and discards stale roles', () => {
    changeRoleState.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.requestStateChange(staff);
    component.confirmState();
    fixture.detectChanges();
    expect(component.permissions()).toBeNull();
    expect(component.roles()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('دسترسی مدیریت نقش لغو شده');
    fixture.destroy();
  });

  it('refuses a reserved owner name without sending a mutation', () => {
    const fixture = TestBed.createComponent(TenantRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.setValue({ name: ' OWNER ', description: '' });
    component.save();
    expect(createRole).not.toHaveBeenCalled();
    expect(component.saveError()).toContain('غیررزرو شده');
    fixture.destroy();
  });
});
