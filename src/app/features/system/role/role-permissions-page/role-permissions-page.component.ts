import { Component, DestroyRef, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, finalize, of, switchMap } from 'rxjs';
import { RolePermissionTreeComponent } from '../role-permission-tree/role-permission-tree.component';
import { RolePermissionTreeNode, RolesService } from '../roles.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../../../shared/components/form-components';
import { SystemUiAccessService } from '../../../../shared/permissions/system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from '../../../../shared/permissions/system-ui-access-pilot.token';
import { rolePermissionUiKeys } from '../../../../shared/permissions/role-permission-ui.keys';

@Component({
  selector: 'app-role-permissions-page',
  templateUrl: './role-permissions-page.component.html',
  styleUrls: ['./role-permissions-page.component.scss'],
  imports: [
    MatIconModule,
    RolePermissionTreeComponent,
    MatProgressBarModule,
    CommonModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
})
export class RolePermissionsPageComponent implements OnInit {
  @ViewChild(RolePermissionTreeComponent)
  permissionTree!: RolePermissionTreeComponent;
  private readonly uiAccess = inject(SystemUiAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pilotEnabled = inject(SYSTEM_UI_ACCESS_PILOT_ENABLED);
  readonly canSavePermissions = signal(!this.pilotEnabled);

  roleId = input.required<string>();

  nodes = signal<RolePermissionTreeNode[]>([]);
  selectedPermissionIds = signal<string[]>([]);

  loading = false;
  saving = false;

  constructor(private readonly rolePermissionService: RolesService) {}

  ngOnInit(): void {
    this.loadPermissions();
    if (this.pilotEnabled) {
      this.uiAccess.canAccess(rolePermissionUiKeys.saveAction)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(allowed => this.canSavePermissions.set(allowed));
    }
  }

  loadPermissions(): void {
    this.loading = true;

    this.rolePermissionService
      .getRolePermissionTreeNodes(this.roleId())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.nodes.set(result.nodes);
          this.selectedPermissionIds.set(result.selectedPermissionIds);
        },
        error: () => {
          // اینجا toast/snackbar خودتان را صدا بزنید
        },
      });
  }

  save(): void {
    if (this.saving || this.loading || !this.canSavePermissions()) return;
    const permissionIds = this.permissionTree.getSelectedPermissionIds();

    this.saving = true;
    // Re-read live access at click time, never trust an earlier UI hint.
    // The API itself must still enforce write permissions independently.
    (this.pilotEnabled
      ? this.uiAccess.refreshAction(rolePermissionUiKeys.saveAction)
      : of(true))
      .pipe(
        switchMap(allowed => {
          this.canSavePermissions.set(allowed);
          return allowed
            ? this.rolePermissionService.updateRolePermissions(this.roleId(), permissionIds)
            : EMPTY;
        }),
        finalize(() => (this.saving = false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Show success notification using the host app's snackbar later.
        },
        error: () => {
          // Backend authorization remains authoritative; never retry writes.
        },
      });
  }

  onPermissionSelectionChanged(permissionIds: string[]): void {
    this.selectedPermissionIds.set(permissionIds);

    console.log('selected permissions:', this.selectedPermissionIds);
  }
}
