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
import { TokenStorageService } from './shared/services/token-storage.service'
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
      // Identity-origin Angular uses interactive login only. Remove any
      // stale legacy bearer tokens when the BFF pilot build is loaded there.
      const host = window.location.hostname.toLowerCase()
      const base = environment.workspaceBaseDomain.toLowerCase()
      if (environment.bffTenantPilotEnabled &&
          (host === 'identity.' + base || host === 'auth.' + base)) {
        inject(TokenStorageService).clear()
        return
      }
      if (!isTenantWorkspaceHost(host, base))
        return
      if (environment.bffTenantPilotEnabled) {
        // Stale legacy OAuth credentials must not coexist with this cookie
        // pilot. Do not confuse Tenant branding cache with auth state.
        inject(TokenStorageService).clear()
      }
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
