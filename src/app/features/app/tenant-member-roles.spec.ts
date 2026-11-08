import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TenantMemberRolesComponent } from './tenant-member-roles.component';
import { TenantWorkspaceService } from './tenant-workspace.service';

const memberId = '11111111-1111-4111-8111-111111111111';
const active = { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  name: 'Reception', isActive: true, assigned: false };
const inactiveAssigned = { id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  name: 'Legacy Role', isActive: false, assigned: true };
const inactiveNotAssigned = { id: 'ccccccc3-cccc-4ccc-8ccc-ccccccccccc3',
  name: 'Inactive Role', isActive: false, assigned: false };
const version = 'AQIDBAUGBwg=';
const writable = {
  userId: memberId, userName: 'staff', version, canEdit: true,
  roles: [active, inactiveAssigned, inactiveNotAssigned],
};

describe('Tenant direct member roles', () => {
  const getMemberRoles = vi.fn();
  const replaceMemberRoles = vi.fn();

  beforeEach(async () => {
    getMemberRoles.mockReset().mockReturnValue(of(writable));
    replaceMemberRoles.mockReset().mockReturnValue(of({ version: 'AQIDBAUGBwk=' }));
    await TestBed.configureTestingModule({
      imports: [TenantMemberRolesComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {
          snapshot: { paramMap: convertToParamMap({ id: memberId }) },
        } },
        { provide: TenantWorkspaceService, useValue: {
          getMemberRoles, replaceMemberRoles,
        } },
      ],
    }).compileComponents();
  });

  it('shows read-only direct roles and protects server-ineligible targets', () => {
    getMemberRoles.mockReturnValueOnce(of({ ...writable, canEdit: false }));
    const fixture = TestBed.createComponent(TenantMemberRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('فقط قابل مشاهده');
    component.beginEdit();
    component.toggle(active, true);
    component.save();
    expect(component.editMode()).toBe(false);
    expect(replaceMemberRoles).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('sends all selected direct roles and user RowVersion without tenantId', () => {
    const fixture = TestBed.createComponent(TenantMemberRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.beginEdit();
    component.toggle(active, true);
    expect(component.hasChanges()).toBe(true);
    component.save();
    expect(replaceMemberRoles).toHaveBeenCalledWith(memberId, version,
      [active.id, inactiveAssigned.id]);
    expect(getMemberRoles).toHaveBeenCalledTimes(2);
    expect(component.editMode()).toBe(false);
    fixture.destroy();
  });

  it('preserves or revokes an existing inactive role but never grants a new inactive role', () => {
    const fixture = TestBed.createComponent(TenantMemberRolesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.beginEdit();
    component.toggle(inactiveNotAssigned, true);
    expect(component.isSelected(inactiveNotAssigned.id)).toBe(false);
    component.toggle(inactiveAssigned, false);
    expect(component.isSelected(inactiveAssigned.id)).toBe(false);
    component.save();
    expect(replaceMemberRoles).toHaveBeenCalledWith(memberId, version, []);
    fixture.destroy();
  });

  it('discards draft and reloads on optimistic concurrency 409', () => {
    replaceMemberRoles.mockReturnValueOnce(throwError(() => ({ status: 409 })));
    const fixture = TestBed.createComponent(TenantMemberRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.beginEdit();
    fixture.componentInstance.toggle(active, true);
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.editMode()).toBe(false);
    expect(getMemberRoles).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('تغییر کرده‌اند');
    fixture.destroy();
  });

  it('clears stale role matrix on revoked 403', () => {
    replaceMemberRoles.mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const fixture = TestBed.createComponent(TenantMemberRolesComponent);
    fixture.detectChanges();
    fixture.componentInstance.beginEdit();
    fixture.componentInstance.toggle(active, true);
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.matrix()).toBeNull();
    expect(fixture.componentInstance.editMode()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('مجوز مدیریت نقش‌های این عضو');
    fixture.destroy();
  });
});
