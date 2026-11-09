import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantGroupsComponent } from './tenant-groups.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

describe('Tenant Group lifecycle page', () => {
  const getGroups = vi.fn();
  const getAdminCapabilities = vi.fn();
  const createGroup = vi.fn();
  const updateGroup = vi.fn();
  const changeGroupState = vi.fn();
  const group = {
    id: 'group-local', name: 'Reception', description: 'Front desk',
    isActive: true, version: 'AQIDBAUGBwg=',
  };
  const caps = {
    canViewGroups: true,
    canCreateGroups: true, canUpdateGroups: true, canChangeGroupState: true,
  };

  beforeEach(async () => {
    getGroups.mockReset().mockReturnValue(of({
      items: [group], page: 1, hasNext: false,
    }));
    getAdminCapabilities.mockReset().mockReturnValue(of(caps));
    createGroup.mockReset().mockReturnValue(of(group));
    updateGroup.mockReset().mockReturnValue(of(group));
    changeGroupState.mockReset().mockReturnValue(of({ ...group, isActive: false }));
    await TestBed.configureTestingModule({
      imports: [TenantGroupsComponent],
      providers: [
        { provide: TenantWorkspaceService, useValue: {
          getGroups, getAdminCapabilities, createGroup, updateGroup, changeGroupState,
        } },
      ],
    }).compileComponents();
  });

  it('creates an empty Group with trimmed values, not grants or memberships', () => {
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    const instance = f.componentInstance;
    expect(f.nativeElement.textContent).toContain('گروه‌های فضای کاری');
    instance.openCreate();
    instance.form.setValue({ name: '  Reception Desk  ', description: '  Lobby  ' });
    instance.save();
    expect(createGroup).toHaveBeenCalledExactlyOnceWith({
      name: 'Reception Desk', description: 'Lobby',
    });
    const payload = createGroup.mock.calls[0][0];
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('roleIds');
    expect(payload).not.toHaveProperty('userIds');
    expect(payload).not.toHaveProperty('isActive');
    expect(instance.editorOpen()).toBe(false);
    expect(f.nativeElement.querySelector('form')).toBeNull();
    expect(getGroups).toHaveBeenCalledTimes(2);
    f.destroy();
  });

  it('updates one Group with SQL RowVersion and no client TenantId', () => {
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    const instance = f.componentInstance;
    instance.openEdit(group);
    instance.form.setValue({ name: 'Reception Updated', description: '' });
    instance.save();
    expect(updateGroup).toHaveBeenCalledExactlyOnceWith(group.id, {
      name: 'Reception Updated', description: null,
      expectedVersion: group.version,
    });
    expect(createGroup).not.toHaveBeenCalled();
    f.destroy();
  });

  it('requires confirmation and sends exact version for Group deactivation', () => {
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    f.componentInstance.requestStateChange(group);
    expect(f.nativeElement.textContent).toContain('تأیید تغییر وضعیت گروه');
    expect(changeGroupState).not.toHaveBeenCalled();
    f.componentInstance.confirmState();
    expect(changeGroupState).toHaveBeenCalledExactlyOnceWith(group.id, {
      isActive: false, expectedVersion: group.version,
    });
    expect(f.componentInstance.pendingState()).toBeNull();
    f.destroy();
  });

  it('shows no writes if backend capabilities explicitly deny all Group ACTIONs', () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      ...caps, canCreateGroups: false, canUpdateGroups: false,
      canChangeGroupState: false,
    }));
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    f.componentInstance.openCreate();
    f.componentInstance.openEdit(group);
    f.componentInstance.requestStateChange(group);
    expect(f.componentInstance.editorOpen()).toBe(false);
    expect(f.componentInstance.pendingState()).toBeNull();
    expect(f.nativeElement.textContent).not.toContain('ساخت گروه جدید');
    expect(createGroup).not.toHaveBeenCalled();
    f.destroy();
  });

  it('refreshes a 409 conflict without retrying the stale Group version', () => {
    updateGroup.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    f.componentInstance.openEdit(group);
    f.componentInstance.form.setValue({ name: 'Stale', description: '' });
    f.componentInstance.save();
    expect(updateGroup).toHaveBeenCalledTimes(1);
    expect(getGroups).toHaveBeenCalledTimes(2);
    expect(f.componentInstance.editorOpen()).toBe(false);
    expect(f.nativeElement.textContent).toContain('نام تکراری');
    f.destroy();
  });

  it('clears stale list and privileges immediately after 403', () => {
    changeGroupState.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    f.componentInstance.requestStateChange(group);
    f.componentInstance.confirmState();
    expect(f.componentInstance.groups()).toBeNull();
    expect(f.componentInstance.permissions()).toBeNull();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('دسترسی مدیریت گروه لغو شده');
    f.destroy();
  });

  it('rejects reserved Group names without sending HTTP mutations', () => {
    const f = TestBed.createComponent(TenantGroupsComponent);
    f.detectChanges();
    f.componentInstance.openCreate();
    f.componentInstance.form.setValue({ name: ' owner ', description: '' });
    f.componentInstance.save();
    expect(createGroup).not.toHaveBeenCalled();
    expect(f.componentInstance.saveError()).toContain('غیررزرو شده');
    f.destroy();
  });
});
