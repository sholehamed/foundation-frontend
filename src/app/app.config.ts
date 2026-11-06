import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { apiAuthInterceptor } from './shared/interceptors/api-auth.interceptor'
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
} from '@angular/router'
import { routes } from './app.routes'
import moment from 'moment'
import { environment } from '../environments/environment'
import { TenantContextService } from './shared/services/tenant-context.service'
import { isTenantWorkspaceHost } from './shared/util/tenant-workspace-host'
import { provideJalaliDateAdapter } from './shared/util/JalaliDateAdapter'
import { MatPaginatorIntl } from '@angular/material/paginator'
import { MatPaginatorIntlFa } from './shared/util/MatPaginatorIntlFa'

moment.locale('fa')
;(moment as any).loadPersian?.({ dialect: 'persian-modern', usePersianDigits: true })

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Resolve trusted tenant branding/context before rendering a tenant-host login.
    // Never resolve a tenant for marketing or platform-admin routes on the root domain.
    provideAppInitializer(() => {
      // The Identity-host Angular login shell is not a Tenant workspace.
      if (!isTenantWorkspaceHost(window.location.hostname, environment.workspaceBaseDomain))
        return
      return inject(TenantContextService).initialize()
    }),
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlFa },

    provideHttpClient(withInterceptors([apiAuthInterceptor])),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' })
    ),
    provideJalaliDateAdapter(),
  ],
}
