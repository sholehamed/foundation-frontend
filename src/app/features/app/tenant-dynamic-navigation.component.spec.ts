import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantDynamicNavigationComponent } from './tenant-dynamic-navigation.component';
import { TenantNavigationCategory } from './tenant-workspace.service';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../../environments/environment.prod';
import { environment as browserPilot } from '../../../environments/environment.bff-pilot.e2e';

describe('FR-14C-1 Tenant dynamic menu pilot', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }));

  it('keeps the dynamic navigation feature OFF in all deployment variants', () => {
    for (const config of [environment, production, browserPilot]) {
      expect(config.tenantDynamicNavigationPilotEnabled).toBe(false);
    }
  });

  it('renders only returned server items, including recursively nested links', () => {
    const fixture = TestBed.createComponent(TenantDynamicNavigationComponent);
    const categories: TenantNavigationCategory[] = [{
      title: 'Workspace',
      items: [
        { title: 'Home', icon: 'home', route: '/dashboard',
          externalUrl: null, childs: [] },
        {
          title: 'Administration', icon: null,
          route: null, externalUrl: null,
          childs: [{
            title: 'Members', icon: 'people', route: '/dashboard/members',
            externalUrl: null, childs: [],
          }],
        },
      ],
    }];
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Workspace');
    expect(text).toContain('Administration');
    expect(text).toContain('Members');
    const anchors: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll('a');
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute('href')).toBe('/dashboard');
    expect(anchors[1].getAttribute('href')).toBe('/dashboard/members');

    // Revoking the server result removes the link without a static fallback.
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);
  });

  it('opens only server-provided external HTTPS URLs with isolation', () => {
    const fixture = TestBed.createComponent(TenantDynamicNavigationComponent);
    fixture.componentRef.setInput('categories', [{
      title: 'Docs', items: [{
        title: 'Help', icon: null, route: null,
        externalUrl: 'https://example.test/help', childs: [],
      }],
    }] as TenantNavigationCategory[]);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://example.test/help');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
