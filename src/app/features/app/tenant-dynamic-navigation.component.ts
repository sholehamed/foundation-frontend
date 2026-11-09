import { Component, Input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TenantNavigationCategory } from './tenant-workspace.service';

/**
 * FR-14C-1: renders only the read-only, server-curated navigation tree.
 * No role names, tenant ids, UI permission checks or token decoding here.
 * Angular guards and the API still enforce access independently.
 */
@Component({
  selector: 'app-tenant-dynamic-navigation',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-template #recursive let-items>
      @for (item of items; track $index) {
        @if (item.route) {
          <a [routerLink]="item.route" routerLinkActive="selected">
            {{ item.title }}
          </a>
        } @else if (item.externalUrl) {
          <a [href]="item.externalUrl" target="_blank"
            rel="noopener noreferrer" referrerpolicy="no-referrer">
            {{ item.title }}
          </a>
        } @else {
          <span class="tenant-navigation-folder">{{ item.title }}</span>
        }
        @if (item.childs?.length) {
          <ng-container *ngTemplateOutlet="recursive; context: { $implicit: item.childs }" />
        }
      }
    </ng-template>

    @for (category of categories; track $index) {
      @if (category.items?.length) {
        <span class="tenant-navigation-category">{{ category.title }}</span>
        <ng-container *ngTemplateOutlet="recursive; context: { $implicit: category.items }" />
      }
    }
  `,
})
export class TenantDynamicNavigationComponent {
  @Input({ required: true }) categories: readonly TenantNavigationCategory[] = [];
}
