import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RolesService } from '../roles.service';
import { RolePermissionsPageComponent } from './role-permissions-page.component';
import { SystemUiAccessService } from '../../../../shared/permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../../shared/permissions/system-ui-access-pilot.token';
import { rolePermissionUiKeys } from '../../../../shared/permissions/role-permission-ui.keys';

describe('RolePermissionsPageComponent gated Save', () => {
  const getRolePermissionTreeNodes = vi.fn(() =>
    of({ nodes: [], selectedPermissionIds: [] }));
  const updateRolePermissions = vi.fn(() => of(undefined));
  const canAccess = vi.fn(() => of(true));
  const refreshAction = vi.fn(() => of(true));

  beforeEach(async () => {
    getRolePermissionTreeNodes.mockClear();
    updateRolePermissions.mockClear();
    canAccess.mockReset();
    canAccess.mockReturnValue(of(true));
    refreshAction.mockReset();
    refreshAction.mockReturnValue(of(true));
    await TestBed.configureTestingModule({
      imports: [RolePermissionsPageComponent],
      providers: [
        provideRouter([]),
        { provide: RolesService, useValue: {
          getRolePermissionTreeNodes, updateRolePermissions,
        }},
        { provide: SystemUiAccessService, useValue: { canAccess, refreshAction } },
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: false },
      ],
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(RolePermissionsPageComponent);
    const roleId = '09c8167c-f61d-4e41-9702-5940d42fe03c';
    fixture.componentRef.setInput('roleId', roleId);
    fixture.detectChanges();
    return { fixture, roleId, component: fixture.componentInstance };
  }

  it('preserves pre-rollout behavior while pilot is OFF', async () => {
    const { fixture, roleId, component } = create();
    await fixture.whenStable();
    expect(getRolePermissionTreeNodes).toHaveBeenCalledWith(roleId);
    expect(component.canSavePermissions()).toBe(true);
    expect(canAccess).not.toHaveBeenCalled();
    component.save();
    expect(updateRolePermissions).toHaveBeenCalledWith(roleId, []);
    fixture.destroy();
  });

  it('requires a live ACTION grant and rechecks it when Save is clicked', () => {
    TestBed.overrideProvider(SYSTEM_UI_ACCESS_PILOT_ENABLED, { useValue: true });
    const { fixture, roleId, component } = create();
    expect(canAccess).toHaveBeenCalledWith(rolePermissionUiKeys.saveAction);
    expect(component.canSavePermissions()).toBe(true);

    // The user is revoked after the page has already loaded: UI must never
    // send a write based on the previous button state.
    refreshAction.mockReturnValueOnce(of(false));
    component.save();
    expect(canAccess).toHaveBeenCalledTimes(1);
    expect(refreshAction).toHaveBeenCalledOnce();
    expect(updateRolePermissions).not.toHaveBeenCalled();
    expect(component.canSavePermissions()).toBe(false);
    expect(component.saving).toBe(false);
    fixture.destroy();
  });

  it('does not allow clicks before permission check returns allowed', () => {
    TestBed.overrideProvider(SYSTEM_UI_ACCESS_PILOT_ENABLED, { useValue: true });
    canAccess.mockReturnValue(of(false));
    const { fixture, component } = create();
    expect(component.canSavePermissions()).toBe(false);
    component.save();
    expect(updateRolePermissions).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
