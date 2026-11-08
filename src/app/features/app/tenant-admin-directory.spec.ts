import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantWorkspaceService } from './tenant-workspace.service';
import { TenantAdminDirectoryComponent } from './tenant-admin-directory.component';

describe('Tenant owner directory pages', () => {
  const getMembers = vi.fn();
  const getRoles = vi.fn();
  const getGroups = vi.fn();

  beforeEach(async () => {
    getMembers.mockReset().mockReturnValue(of({ items: [{
      id: 'owned', userName: 'owner', email: 'owner@test.local',
      firstName: 'Local', lastName: 'Owner', isActive: true,
    }], page: 1, hasNext: true }));
    getRoles.mockReset().mockReturnValue(of({ items: [], page: 1, hasNext: false }));
    getGroups.mockReset().mockReturnValue(of({ items: [], page: 1, hasNext: false }));
    await TestBed.configureTestingModule({
      imports: [TenantAdminDirectoryComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ directoryKind: 'members' }) } },
        { provide: TenantWorkspaceService, useValue: { getMembers, getRoles, getGroups } },
      ],
    }).compileComponents();
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
});
