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

describe('SidebarComponent optional tenant logo', () => {
  let context: { current: { logo?: string } | null };
  let preview: ReturnType<typeof vi.fn>;
  let roles: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    context = { current: null };
    preview = vi.fn();
    roles = vi.fn(() => of([]));

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: TenantContextService, useValue: context },
        { provide: FileService, useValue: { preview } },
        { provide: SidebarMenuService, useValue: { getRoles: roles } },
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

  it('loads the System menu with no tenant and keeps the fallback logo', () => {
    expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
    expect(roles).toHaveBeenCalledOnce();
    expect(preview).not.toHaveBeenCalled();
    expect(fixture.componentInstance._logoSrc).toBe('shinera-dark-logo.png');
    expect(fixture.componentInstance.menuSections().length).toBeGreaterThan(0);
  });

  it('does not request a preview when tenant branding has no logo', () => {
    context.current = { logo: '   ' };
    fixture.componentInstance.ngOnInit();

    expect(roles).toHaveBeenCalledOnce();
    expect(preview).not.toHaveBeenCalled();
    expect(fixture.componentInstance._logoSrc).toBe('shinera-dark-logo.png');
  });

  it('keeps the sidebar and fallback logo if the media request fails', () => {
    context.current = { logo: 'missing-media-id' };
    preview.mockReturnValue(throwError(() => new Error('404')));

    expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
    expect(preview).toHaveBeenCalledWith('missing-media-id');
    expect(fixture.componentInstance._logoSrc).toBe('shinera-dark-logo.png');
    expect(roles).toHaveBeenCalledOnce();
  });

  it('loads the tenant logo and revokes the temporary preview URL at teardown', () => {
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
      expect(preview).toHaveBeenCalledWith('tenant-media-id');
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
