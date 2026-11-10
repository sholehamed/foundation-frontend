import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PlanCatalogRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  parentPlanId: string | null;
  draftVersionId: string | null;
  latestVersionNumber: number | null;
  latestVersionStatus: 'Draft' | 'Published' | 'Retired' | null;
  publishedVersions: number;
  latestPublishedVersionId: string | null;
}

export interface CommercialModuleOption {
  code: string;
  title: string;
}

export interface PlanDraftCreate {
  code: string;
  name: string;
  description: string | null;
  parentPlanVersionId: string | null;
  displayTitle: string;
  displaySubtitle: string | null;
}

export interface PlanDraftPrice {
  billingCycle: 'monthly' | 'yearly';
  currency: 'IRR';
  amount: number;
}

export interface PlanDraftCapability {
  code: string;
  booleanValue: boolean | null;
  integerValue: number | null;
  isUnlimited: boolean;
  modes: string[] | null;
}

export interface PlanDraftDisplay {
  kind: 'Module' | 'Capability' | 'Benefit';
  code: string | null;
  title: string;
  description: string | null;
  isHighlighted: boolean;
  sortOrder: number;
}

export interface PlanDraftContent {
  displayTitle: string;
  displaySubtitle: string | null;
  badgeText: string | null;
  isRecommended: boolean;
  displayOrder: number;
  moduleCodes: string[];
  prices: PlanDraftPrice[];
  capabilities: PlanDraftCapability[];
  displayItems: PlanDraftDisplay[];
}

export interface PlanDraftDetails {
  id: string;
  planId: string;
  versionNumber: number;
  planCode: string;
  parentPlanVersionId: string | null;
  content: PlanDraftContent;
}

export interface PlanDraftPreview {
  versionId: string;
  versionNumber: number;
  fingerprint: string;
  canPublish: boolean;
  issues: string[];
  effectiveModuleCodes: string[];
}

export interface CatalogOperation {
  ok: boolean;
  code: string;
  id: string | null;
  preview: PlanDraftPreview | null;
}

/**
 * Strictly System Administrator endpoints. The browser never provides TenantId,
 * RoleId, an entitlement, or a subscription grant. Publication only changes
 * the immutable-by-command PlanVersion catalog, not Tenant permissions.
 */
@Injectable({ providedIn: 'root' })
export class SystemPlanCatalogService {
  private readonly http = inject(HttpClient);
  private readonly root = environment.apiUrl.replace(/\/$/, '') + '/system/PlanCatalog';

  list(): Observable<PlanCatalogRow[]> {
    return this.http.get<PlanCatalogRow[]>(this.root);
  }

  commercialModules(): Observable<CommercialModuleOption[]> {
    return this.http.get<CommercialModuleOption[]>(this.root + '/commercial-modules');
  }

  create(request: PlanDraftCreate): Observable<CatalogOperation> {
    return this.http.post<CatalogOperation>(this.root, request);
  }

  createRevision(planId: string): Observable<CatalogOperation> {
    return this.http.post<CatalogOperation>(this.root + '/' + encodeURIComponent(planId) + '/drafts', {});
  }

  readDraft(id: string): Observable<PlanDraftDetails> {
    return this.http.get<PlanDraftDetails>(this.draftUrl(id));
  }

  saveDraft(id: string, content: PlanDraftContent): Observable<CatalogOperation> {
    return this.http.put<CatalogOperation>(this.draftUrl(id), content);
  }

  preview(id: string): Observable<PlanDraftPreview> {
    return this.http.get<PlanDraftPreview>(this.draftUrl(id) + '/preview');
  }

  publish(id: string, fingerprint: string): Observable<CatalogOperation> {
    return this.http.post<CatalogOperation>(this.draftUrl(id) + '/publish', { fingerprint });
  }

  private draftUrl(id: string): string {
    return this.root + '/drafts/' + encodeURIComponent(id);
  }
}
