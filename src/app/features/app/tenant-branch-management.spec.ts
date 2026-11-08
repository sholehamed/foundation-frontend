import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantBranchesComponent } from './tenant-branches.component';
import { TenantWorkspaceService, TenantWorkspaceBranch } from './tenant-workspace.service';

const owned: TenantWorkspaceBranch = {
  id: 'own-main', name: 'Main', city: 'Tehran',
  address: 'First', phone: null, isMain: true,
};
describe('Tenant branch owner management', () => {
  const getAdminCapabilities = vi.fn();
  const getBranches = vi.fn();
  const createBranch = vi.fn();
  const updateBranch = vi.fn();

  beforeEach(async () => {
    getAdminCapabilities.mockReset().mockReturnValue(of({
      canViewAdministration: true, canManageBranches: true,
    }));
    getBranches.mockReset().mockReturnValue(of([owned]));
    createBranch.mockReset().mockReturnValue(of({ ...owned, id: 'new', isMain: false }));
    updateBranch.mockReset().mockReturnValue(of(owned));
    await TestBed.configureTestingModule({
      imports: [TenantBranchesComponent],
      providers: [{ provide: TenantWorkspaceService,
        useValue: { getBranches, getAdminCapabilities, createBranch, updateBranch } }],
    }).compileComponents();
  });

  it('adds a non-main branch with normalized form fields, then refreshes list', () => {
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditor();
    fixture.componentInstance.form.setValue({
      name: ' New location ', city: ' Tehran ', address: ' Road ', phone: ' 021 ',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(createBranch).toHaveBeenCalledWith({
      name: 'New location', city: 'Tehran', address: 'Road', phone: '021',
    });
    expect(updateBranch).not.toHaveBeenCalled();
    expect(getBranches).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('شعبه جدید ثبت شد');
    fixture.destroy();
  });

  it('edits an owned main branch without sending its main or tenant fields', () => {
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditor(owned);
    fixture.componentInstance.form.patchValue({ name: 'Renamed main' });
    fixture.componentInstance.save();
    expect(updateBranch).toHaveBeenCalledWith('own-main', {
      name: 'Renamed main', city: 'Tehran', address: 'First', phone: null,
    });
    fixture.destroy();
  });

  it('keeps write controls closed when capability is not granted', () => {
    getAdminCapabilities.mockReturnValueOnce(of({
      canViewAdministration: false, canManageBranches: false,
    }));
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditor(owned);
    expect(fixture.componentInstance.editorOpen()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('ثبت شعبه جدید');
    expect(createBranch).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('fails closed and clears stale data on revoked owner / HTTP 403', () => {
    createBranch.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditor();
    fixture.componentInstance.form.setValue({
      name: 'Extra', city: 'Shiraz', address: 'Street', phone: '',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.canManageBranches()).toBe(false);
    expect(fixture.componentInstance.branches()).toBeNull();
    expect(fixture.componentInstance.editorOpen()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('مجوز مدیریت شعبه');
    fixture.destroy();
  });

  it('blocks blank trimmed name before sending a mutation', () => {
    const fixture = TestBed.createComponent(TenantBranchesComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEditor();
    fixture.componentInstance.form.setValue({
      name: '   ', city: 'Tehran', address: 'Street', phone: '',
    });
    fixture.componentInstance.save();
    expect(createBranch).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saveError()).toContain('کامل');
    fixture.destroy();
  });
});
