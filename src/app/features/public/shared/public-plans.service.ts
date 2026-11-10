import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PublicPlanPrice {
  billingCycle: string;
  currency: string;
  amount: number;
}

export interface PublicPlanFeature {
  kind: 'Module' | 'Capability' | 'Benefit';
  title: string;
  description: string | null;
  isHighlighted: boolean;
}

/**
 * Exactly the backend's published PlanVersion projection, not a user grant
 * or a confirmation of subscription/purchase. No client-side inheritance.
 */
export interface PublicPlanCard {
  code: string;
  versionId: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  isRecommended: boolean;
  displayOrder: number;
  prices: PublicPlanPrice[];
  features: PublicPlanFeature[];
}

@Injectable({ providedIn: 'root' })
export class PublicPlansService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl.replace(/\/$/, '') + '/public/plans';

  list(): Observable<PublicPlanCard[]> {
    return this.http.get<PublicPlanCard[]>(this.url);
  }
}
