import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RolesService } from '../roles.service';
import { RolePermissionsPageComponent } from './role-permissions-page.component';

describe('RolePermissionsPageComponent', () => {
  const getRolePermissionTreeNodes = vi.fn(() =>
    of({ nodes: [], selectedPermissionIds: [] })
  );

  beforeEach(async () => {
    getRolePermissionTreeNodes.mockClear();
    await TestBed.configureTestingModule({
      imports: [RolePermissionsPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: RolesService,
          useValue: {
            getRolePermissionTreeNodes,
            updateRolePermissions: () => of(undefined),
          },
        },
      ],
    }).compileComponents();
  });

  it('should use the requested role ID to load permissions', async () => {
    const fixture = TestBed.createComponent(RolePermissionsPageComponent);
    const roleId = '09c8167c-f61d-4e41-9702-5940d42fe03c';
    fixture.componentRef.setInput('roleId', roleId);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect(getRolePermissionTreeNodes).toHaveBeenCalledWith(roleId);
    expect(fixture.componentInstance.loading).toBe(false);
  });
});
