import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SystemCanDirective } from './system-can.directive';
import { SystemUiAccessService } from './system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from './system-ui-access-pilot.token';

@Component({
  standalone: true,
  imports: [SystemCanDirective],
  template: `
    <button *systemCan="'/system/roles/create'" id="create-role">Create</button>
    <button *systemCan="'system.roles.action.delete'" id="delete-role">Delete</button>
  `,
})
class TestList {}

describe('*systemCan route and action presentation', () => {
  const canAccessRoute = vi.fn(() => of(false));
  const canAccess = vi.fn(() => of(false));

  function setup(enabled: boolean) {
    TestBed.configureTestingModule({
      imports: [TestList],
      providers: [
        { provide: SYSTEM_UI_ACCESS_PILOT_ENABLED, useValue: enabled },
        { provide: SystemUiAccessService, useValue: { canAccessRoute, canAccess } },
      ],
    });
    const fixture = TestBed.createComponent(TestList);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    canAccessRoute.mockReset();
    canAccess.mockReset();
    canAccessRoute.mockReturnValue(of(false));
    canAccess.mockReturnValue(of(false));
  });

  it('does not restrict existing UI while explicit deployment rollout is OFF', () => {
    const fixture = setup(false);
    expect(fixture.nativeElement.querySelector('#create-role')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#delete-role')).toBeTruthy();
    expect(canAccessRoute).not.toHaveBeenCalled();
    expect(canAccess).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('hides each denied affordance without creating a fallback element', () => {
    const fixture = setup(true);
    expect(canAccessRoute).toHaveBeenCalledWith('/system/roles/create');
    expect(canAccess).toHaveBeenCalledWith('system.roles.action.delete');
    expect(fixture.nativeElement.querySelector('#create-role')).toBeNull();
    expect(fixture.nativeElement.querySelector('#delete-role')).toBeNull();
    fixture.destroy();
  });

  it('renders only explicitly allowed PAGE route and ACTION key', () => {
    canAccessRoute.mockReturnValue(of(true));
    const fixture = setup(true);
    expect(fixture.nativeElement.querySelector('#create-role')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#delete-role')).toBeNull();
    fixture.destroy();
  });
});
