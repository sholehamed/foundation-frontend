import { Directive, DestroyRef, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SystemUiAccessService } from './system-ui-access.service';
import { SYSTEM_UI_ACCESS_PILOT_ENABLED } from './system-ui-access-pilot.token';

/**
 * *systemCan="'/system/roles/create'" or
 * *systemCan="'system.menu-management.action.delete'".
 * A template affordance only, not an API security boundary.
 */
@Directive({ selector: '[systemCan]', standalone: true })
export class SystemCanDirective {
  private readonly view = inject(ViewContainerRef);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly access = inject(SystemUiAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly enabled = inject(SYSTEM_UI_ACCESS_PILOT_ENABLED);
  private rendered = false;
  private generation = 0;

  @Input({ required: true })
  set systemCan(keyOrRoute: string) {
    const generation = ++this.generation;
    if (!this.enabled) {
      this.render(true);
      return;
    }

    this.render(false);
    const read = keyOrRoute.startsWith('/system/')
      ? this.access.canAccessRoute(keyOrRoute)
      : this.access.canAccess(keyOrRoute);
    read.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(allowed => {
      if (generation === this.generation) this.render(allowed);
    });
  }

  private render(allowed: boolean): void {
    if (allowed === this.rendered) return;
    this.rendered = allowed;
    if (allowed) this.view.createEmbeddedView(this.template);
    else this.view.clear();
  }
}
