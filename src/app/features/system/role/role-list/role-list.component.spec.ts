import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RoleListComponent } from './role-list.component';
import { RolesService } from '../roles.service';
import { SystemUiAccessService } from '../../../../shared/permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../../shared/permissions/system-ui-access-pilot.token';
import { rolePermissionUiKeys } from '../../../../shared/permissions/role-permission-ui.keys';

describe('Role list live manage-permissions entry', () => {
  const canAccess = vi.fn(() => of(false));
  const refreshAction = vi.fn(() => of(false));
  const changeState = vi.fn(() => of(undefined));

  beforeEach(async () => {
    canAccess.mockReset();
    canAccess.mockReturnValue(of(false));
    refreshAction.mockReset();
    refreshAction.mockReturnValue(of(false));
    changeState.mockReset();
    await TestBed.configureTestingModule({
      imports: [RoleListComponent],
      providers: [
        { provide: RolesService, useValue: { changeState } },
        { provide: SystemUiAccessService, useValue: { canAccess, refreshAction } },
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: true },
      ],
    }).overrideComponent(RoleListComponent, {
      set: { template: '' },
    }).compileComponents();
  });

  it('keeps the role-permissions menu action hidden when live access is denied', () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.detectChanges();
    expect(canAccess).toHaveBeenCalledWith(rolePermissionUiKeys.page);
    expect(fixture.componentInstance.canManageRolePermissions()).toBe(false);
    fixture.destroy();
  });

  it('shows the action when the current user receives live role permissions', () => {
    canAccess.mockReturnValueOnce(of(true));
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.canManageRolePermissions()).toBe(true);
    fixture.destroy();
  });

  it('rechecks CHANGE-STATE on click and never writes after action revocation', () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.detectChanges();
    fixture.componentInstance.changeState('role-one');
    expect(refreshAction).toHaveBeenCalledWith('system.roles.action.change-state');
    expect(changeState).not.toHaveBeenCalled();
    refreshAction.mockReturnValueOnce(of(true));
    fixture.componentInstance.changeState('role-one');
    expect(changeState).toHaveBeenCalledWith('role-one');
    fixture.destroy();
  });

  it('preserves existing list action when rollout is OFF', () => {
    TestBed.overrideProvider(SYSTEM_UI_ACCESS_PILOT_ENABLED, { useValue: false });
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.canManageRolePermissions()).toBe(true);
    expect(canAccess).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
