import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-page-header',
  imports: [BreadcrumbComponent],
  template: `
    <div class="breadcrumb-card mb-25 d-md-flex align-items-center justify-content-between">
      <h5 class="mb-0">
        {{ label() }}
      </h5>

      <app-breadcrumb></app-breadcrumb>
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly label = signal<string>('');

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const currentRoute = this.getDeepestChildRoute(this.activatedRoute.root);
        const breadcrumb = this.findBreadcrumbFromRouteOrParents(currentRoute);

        this.label.set(breadcrumb ?? '');
      });
  }

  private getDeepestChildRoute(route: ActivatedRoute): ActivatedRoute {
    let currentRoute = route;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    return currentRoute;
  }

  private findBreadcrumbFromRouteOrParents(route: ActivatedRoute): string | null {
    let currentRoute: ActivatedRoute | null = route;

    while (currentRoute) {
      const breadcrumb = currentRoute.snapshot.data?.['breadcrumb'];

      if (breadcrumb) {
        return breadcrumb;
      }

      currentRoute = currentRoute.parent;
    }

    return null;
  }
}
