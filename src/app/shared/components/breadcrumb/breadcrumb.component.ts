import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
interface Breadcrumb {
  label: string;
  url: string;
}
@Component({
  selector: 'app-breadcrumb',
  standalone:true,
  imports: [RouterLink,CommonModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    protected router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);

  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
    });
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeUrl = child.snapshot.url
        .map(segment => segment.path)
        .join('/');

      if (routeUrl) {
        url += `/${routeUrl}`;
      }

const label = child.routeConfig?.data?.['breadcrumb'];

      if (label) {
        breadcrumbs.push({
          label,
          url
        });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
