import { CanDeactivateFn } from '@angular/router';
import { BaseFormComponent } from '../components/base-form.component';

export const unsavedChangesGuard: CanDeactivateFn<BaseFormComponent> = (component) => {
  return component.canDeactivate();
};
