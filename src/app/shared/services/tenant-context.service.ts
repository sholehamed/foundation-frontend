import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileService } from '../../shared/components/avatar-upload/upload.service';

export interface TenantContext {
  id: string;
  code: string;
  slug: string;
  domain?: string;
  resolvedDomain: string;
  domains: string[];
  name: string;
  logo?: string;
  favicon?: string;
  cacheVersion?: number;
}

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private tenantContext: TenantContext | null = null;
private _fileService=inject(FileService)
  constructor(private http: HttpClient) {}

  get current(): TenantContext | null {
    return this.tenantContext;
  }

  async initialize(): Promise<void> {
    const host = this.getCurrentHost();

    const cachedByAlias = this.tryGetContextByHostAlias(host);

    if (cachedByAlias && this.isContextValidForHost(cachedByAlias, host)) {
      this.tenantContext = cachedByAlias;
      this.applyBranding(cachedByAlias);
      return;
    }

    const context = await this.resolveTenant(host);
    context.resolvedDomain=this.getCurrentHost();
    
    this.tenantContext = context;
    this.saveTenantContext(context);
    this.applyBranding(context);
  }

  private getCurrentHost(): string {
    return window.location.hostname.toLowerCase();
  }

  private normalizeDomain(domain: string): string {
    
    return domain.trim().toLowerCase();
  }

  private getTenantKey(context: Pick<TenantContext, 'code' | 'id'>): string {
    return context.code
      ? context.code.toLowerCase()
      : context.id.toString();
  }

  private getContextStorageKey(tenantKey: string): string {
    return `tenant_context_${tenantKey}`;
  }

  private getAliasStorageKey(host: string): string {
    return `tenant_alias_${host}`;
  }

  private tryGetContextByHostAlias(host: string): TenantContext | null {
    const normalizedHost = this.normalizeDomain(host);
    const aliasKey = this.getAliasStorageKey(normalizedHost);

    const tenantKey = sessionStorage.getItem(aliasKey);

    if (!tenantKey) {
      return null;
    }

    const contextKey = this.getContextStorageKey(tenantKey);
    const rawContext = sessionStorage.getItem(contextKey);

    if (!rawContext) {
      sessionStorage.removeItem(aliasKey);
      return null;
    }

    try {
      return JSON.parse(rawContext) as TenantContext;
    } catch {
      sessionStorage.removeItem(contextKey);
      sessionStorage.removeItem(aliasKey);
      return null;
    }
  }

  private saveTenantContext(context: TenantContext): void {
    
    const tenantKey = this.getTenantKey(context);
    const contextKey = this.getContextStorageKey(tenantKey);

    const normalizedContext: TenantContext = {
      ...context,
      code: context.code.toLowerCase(),
      slug: context.slug?.toLowerCase(),
      resolvedDomain: this.normalizeDomain(context.resolvedDomain),
      domains: this.getAllKnownDomains(context)
    };

    sessionStorage.setItem(contextKey, JSON.stringify(normalizedContext));

    for (const domain of normalizedContext.domains) {
      const aliasKey = this.getAliasStorageKey(domain);
      sessionStorage.setItem(aliasKey, tenantKey);
    }
  }

  private getAllKnownDomains(context: TenantContext): string[] {
    const domains = new Set<string>();

    if (context.resolvedDomain) {
      domains.add(this.normalizeDomain(context.resolvedDomain));
    }


    if (context.domains?.length) {
      for (const domain of context.domains) {
        domains.add(this.normalizeDomain(domain));
      }
    }

    return Array.from(domains);
  }

  private isContextValidForHost(context: TenantContext, host: string): boolean {
    const normalizedHost = this.normalizeDomain(host);

   

    const domains = this.getAllKnownDomains(context);

    return domains.includes(normalizedHost);
  }

  private async resolveTenant(host: string): Promise<TenantContext> {
    return await firstValueFrom(
      this.http.get<TenantContext>(
        `${environment.apiUrl}/system/tenants/resolve`,
        {
          headers: {
            'X-Tenant-Domain': host
          }
        }
      )
    );
  }

  clearCurrentTenant(): void {
    if (!this.tenantContext) {
      return;
    }

    const tenantKey = this.getTenantKey(this.tenantContext);
    const contextKey = this.getContextStorageKey(tenantKey);

    for (const domain of this.getAllKnownDomains(this.tenantContext)) {
      sessionStorage.removeItem(this.getAliasStorageKey(domain));
    }

    sessionStorage.removeItem(contextKey);
    this.tenantContext = null;
  }

  private activeFaviconUrl: string | null = null; // برای مدیریت حافظه و جلوگیری از Memory Leak

private applyBranding(context: TenantContext): void {
  document.title = context.name;

  if (context.favicon) {
    this._fileService.preview(context.favicon).subscribe({
      next: (blob: Blob) => {
        // ۱. آزادسازی ObjectURL قبلی برای جلوگیری از نشت حافظه
        if (this.activeFaviconUrl) {
          URL.revokeObjectURL(this.activeFaviconUrl);
        }

        // ۲. ایجاد URL جدید برای Favicon
        this.activeFaviconUrl = URL.createObjectURL(blob);

        // ۳. پیدا کردن یا ساختن تگ Favicon
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
        
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }

        // ۴. تنظیم تایپ و آدرس داینامیک
        link.type = blob.type; // مثلاً image/webp یا image/png به صورت داینامیک
        link.href = this.activeFaviconUrl;
      },
      error: (err) => {
        console.error('Error loading tenant favicon:', err);
      }
    });
  }
}
   private setPreview(blob: Blob): string {
    const objectUrl = URL.createObjectURL(blob);
    return objectUrl;
  }
}
