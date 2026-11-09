import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

/**
 * FR-14B-3: all legacy account create/edit Angular pages are disabled.
 * The System lifecycle editor is a separate, opt-in, live-permission PAGE.
 */
export const systemAccountLifecycleGuard: CanActivateFn = () =>
  environment.systemAccountLifecycleUiEnabled &&
  environment.systemUiAccessPilotEnabled
    ? true
    : inject(Router).parseUrl('/system/access-denied');

export const legacySystemAccountCreateDenied: CanActivateFn = () =>
  inject(Router).parseUrl('/system/access-denied');
