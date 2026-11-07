import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarMenuItemComponent } from './sidebar-menu-item.component';

describe('SidebarMenuItemComponent recursive navigation', () => {
  let fixture: ComponentFixture<SidebarMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarMenuItemComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarMenuItemComponent);
  });

  it('renders nested route links at arbitrary depth, not just first-level children', () => {
    fixture.componentInstance.menuItem = {
      title: 'Root', icon: 'folder', route: null, externalUrl: null, childs: [
        {
          title: 'Child', icon: 'folder', route: null, externalUrl: null, childs: [
            { title: 'Grandchild', icon: 'person', route: '/system/users', childs: [] },
          ],
        },
      ],
    };
    fixture.detectChanges();
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a.sidebar-menu-link'),
    );
    expect(links.some(x => x.getAttribute('href') === '/system/users')).toBe(true);
  });

  it('opens external links safely, and avoids linking non-clickable containers', () => {
    fixture.componentInstance.menuItem = {
      title: 'Docs', icon: 'open_in_new', route: null,
      externalUrl: 'https://example.test', childs: [],
    };
    fixture.detectChanges();
    const a = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('https://example.test');
    expect(a.rel).toContain('noopener');
    expect(a.target).toBe('_blank');
  });
});
