import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FileService } from '../../../../components/avatar-upload/upload.service';
import { CustomizerSettingsService } from '../../../../services/customizer-settings.service';
import { TenantContextService } from '../../../../services/tenant-context.service';
import { ToggleService } from '../header/toggle.service';
import { SidebarComponent } from './sidebar.component';
import { SidebarMenuService } from './sidebar-menu.service';

describe('SidebarComponent current-user navigation and optional branding', () => {
  let context: { current: { logo?: string } | null };
  let preview: ReturnType<typeof vi.fn>;
  let getMyNavigation: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    context = { current: null };
    preview = vi.fn();
    getMyNavigation = vi.fn(() => of([]));

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: TenantContextService, useValue: context },
        { provide: FileService, useValue: { preview } },
        { provide: SidebarMenuService, useValue: { getMyNavigation } },
        { provide: ToggleService, useValue: { isSidebarToggled: signal(false), toggle: vi.fn() } },
        { provide: CustomizerSettingsService, useValue: { isNavbarToggled: signal(false) } },
        { provide: Router, useValue: { url: '/system/dashboard' } },
      ],
    })
      .overrideComponent(SidebarComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('loads current-user navigation without a role lookup or static admin fallback', () => {
    expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
    expect(getMyNavigation).toHaveBeenCalledOnce();
    expect(preview).not.toHaveBeenCalled();
    expect(fixture.componentInstance.menuSections()).toEqual([]);
    expect(fixture.componentInstance.menuError()).toBe(false);
    expect(fixture.componentInstance.homeRoute).toBe('/system/dashboard');
    expect(fixture.componentInstance._logoSrc).toBe('shinera-dark-logo.png');
  });

  it('renders only backend-supplied navigation even when no tenant context exists', () => {
    getMyNavigation.mockReturnValue(of([
      { title: 'Configured', items: [
        { title: 'Users', icon: 'group', route: '/system/users', childs: [], externalUrl: null },
      ] },
    ]));
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.menuSections()).toHaveLength(1);
    expect(fixture.componentInstance.menuSections()[0].items[0].title).toBe('Users');
  });

  it('clears privileged links and offers retry on API error', () => {
    getMyNavigation.mockReturnValue(throwError(() => new Error('Unavailable')));
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.menuSections()).toEqual([]);
    expect(fixture.componentInstance.menuError()).toBe(true);
    expect(fixture.componentInstance.isMenuLoading()).toBe(false);

    getMyNavigation.mockReturnValue(of([]));
    fixture.componentInstance.retryMenu();
    expect(getMyNavigation).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.menuSections()).toEqual([]);
    expect(fixture.componentInstance.menuError()).toBe(false);
  });

  it('does not request logo preview when tenant branding is blank', () => {
    context.current = { logo: '   ' };
    fixture.componentInstance.ngOnInit();
    expect(getMyNavigation).toHaveBeenCalledOnce();
    expect(preview).not.toHaveBeenCalled();
  });

  it('keeps the sidebar menu and fallback logo if media preview fails', () => {
    context.current = { logo: 'missing-media-id' };
    preview.mockReturnValue(throwError(() => new Error('404')));
    expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
    expect(preview).toHaveBeenCalledWith('missing-media-id');
    expect(getMyNavigation).toHaveBeenCalledOnce();
  });

  it('loads tenant logo and revokes temporary object URL at teardown', () => {
    context.current = { logo: 'tenant-media-id' };
    const result = new Subject<Blob>();
    preview.mockReturnValue(result.asObservable());
    const oldCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const oldRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    const createObjectURL = vi.fn(() => 'blob:tenant-logo');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    try {
      fixture.componentInstance.ngOnInit();
      result.next(new Blob(['image']));
      expect(fixture.componentInstance._logoSrc).toBe('blob:tenant-logo');
      fixture.destroy();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:tenant-logo');
    } finally {
      if (oldCreate) Object.defineProperty(URL, 'createObjectURL', oldCreate);
      else Reflect.deleteProperty(URL, 'createObjectURL');
      if (oldRevoke) Object.defineProperty(URL, 'revokeObjectURL', oldRevoke);
      else Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });
});
