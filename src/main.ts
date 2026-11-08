import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { captureInitialInvitationFragment } from './app/shared/util/tenant-invitation-token';

captureInitialInvitationFragment();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
