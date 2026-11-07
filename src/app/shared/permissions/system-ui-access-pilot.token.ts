import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Opt-in deployment gate for the first live UI authorization pilot.
 * No credentials/grants are stored here; the Backend remains authoritative. */
export const SYSTEM_UI_ACCESS_PILOT_ENABLED = new InjectionToken<boolean>(
  'SYSTEM_UI_ACCESS_PILOT_ENABLED',
  { providedIn: 'root', factory: () => environment.systemUiAccessPilotEnabled },
);
